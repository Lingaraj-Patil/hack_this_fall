const Clan = require('../models/Clan');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const Helpers = require('../utils/helpers');
const asyncHandler = require('../middleware/asycHandler');
const cacheService = require('../services/cacheService');
const { CLAN_ROLES } = require('../config/constants');

class ClanController {
  createClan = asyncHandler(async (req, res) => {
    const { name, description, isPrivate, maxMembers, banner } = req.body;

    if (req.user.clanId) {
      return ApiResponse.error(res, 'You are already in a clan', 400);
    }

    // Check if clan name exists
    const existingClan = await Clan.findOne({ name: name.trim() });
    if (existingClan) {
      return ApiResponse.error(res, 'Clan name already taken', 409);
    }

    const inviteCode = Helpers.generateInviteCode();

    const clan = new Clan({
      name: name.trim(),
      description,
      leaderId: req.userId,
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 50,
      inviteCode,
      banner,
      members: [{
        userId: req.userId,
        role: CLAN_ROLES.LEADER,
        joinedAt: new Date(),
        contributionPoints: 0
      }]
    });

    await clan.save();

    req.user.clanId = clan._id;
    await req.user.save();

    return ApiResponse.success(res, clan, 'Clan created successfully', 201);
  });

  joinClan = asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    if (req.user.clanId) {
      return ApiResponse.error(res, 'You are already in a clan', 400);
    }

    const clan = await Clan.findOne({ inviteCode, isActive: true });

    if (!clan) {
      return ApiResponse.error(res, 'Invalid invite code', 404);
    }

    if (clan.members.length >= clan.maxMembers) {
      return ApiResponse.error(res, 'Clan is full', 400);
    }

    // Check if already a member (shouldn't happen but defensive)
    const alreadyMember = clan.members.some(
      m => m.userId.toString() === req.userId.toString()
    );

    if (alreadyMember) {
      return ApiResponse.error(res, 'Already a member of this clan', 400);
    }

    clan.members.push({
      userId: req.userId,
      role: CLAN_ROLES.MEMBER,
      joinedAt: new Date(),
      contributionPoints: 0
    });

    await clan.save();

    req.user.clanId = clan._id;
    await req.user.save();

    // Invalidate cache
    await cacheService.deletePattern(`clan:${clan._id}:*`);

    // Notify clan members via socket
    if (global.io) {
      global.io.to(`clan:${clan._id}`).emit('member:joined', {
        userId: req.userId,
        username: req.user.username
      });
    }

    return ApiResponse.success(res, clan, 'Joined clan successfully');
  });

  leaveClan = asyncHandler(async (req, res) => {
    const clan = await Clan.findById(req.user.clanId);

    if (!clan) {
      return ApiResponse.error(res, 'You are not in a clan', 400);
    }

    // Check if leader
    if (clan.leaderId.toString() === req.userId.toString()) {
      if (clan.members.length > 1) {
        return ApiResponse.error(
          res,
          'Transfer leadership before leaving or disband the clan',
          400
        );
      }
      // Last member, delete clan
      await clan.deleteOne();
    } else {
      // Remove member
      clan.members = clan.members.filter(
        m => m.userId.toString() !== req.userId.toString()
      );
      
      // Recalculate clan points
      const totalContribution = clan.members.reduce(
        (sum, m) => sum + (m.contributionPoints || 0),
        0
      );
      clan.totalPoints = totalContribution;
      
      await clan.save();
    }

    req.user.clanId = null;
    await req.user.save();

    // Invalidate cache
    await cacheService.deletePattern(`clan:${clan._id}:*`);

    return ApiResponse.success(res, null, 'Left clan successfully');
  });

  transferLeadership = asyncHandler(async (req, res) => {
    const { newLeaderId } = req.body;

    const clan = await Clan.findById(req.user.clanId);

    if (!clan) {
      return ApiResponse.error(res, 'Clan not found', 404);
    }

    if (clan.leaderId.toString() !== req.userId.toString()) {
      return ApiResponse.error(res, 'Only clan leader can transfer leadership', 403);
    }

    const newLeaderMember = clan.members.find(
      m => m.userId.toString() === newLeaderId
    );

    if (!newLeaderMember) {
      return ApiResponse.error(res, 'New leader must be a clan member', 400);
    }

    // Update roles
    const oldLeaderMember = clan.members.find(
      m => m.userId.toString() === req.userId.toString()
    );
    if (oldLeaderMember) {
      oldLeaderMember.role = CLAN_ROLES.ADMIN;
    }

    newLeaderMember.role = CLAN_ROLES.LEADER;
    clan.leaderId = newLeaderId;

    await clan.save();

    // Invalidate cache
    await cacheService.deletePattern(`clan:${clan._id}:*`);

    return ApiResponse.success(res, clan, 'Leadership transferred successfully');
  });

  updateClan = asyncHandler(async (req, res) => {
    const { name, description, banner, maxMembers, isPrivate } = req.body;

    const clan = await Clan.findById(req.user.clanId);

    if (!clan) {
      return ApiResponse.error(res, 'Clan not found', 404);
    }

    if (clan.leaderId.toString() !== req.userId.toString()) {
      return ApiResponse.error(res, 'Only clan leader can update clan', 403);
    }

    if (name) {
      const existingClan = await Clan.findOne({
        name: name.trim(),
        _id: { $ne: clan._id }
      });
      if (existingClan) {
        return ApiResponse.error(res, 'Clan name already taken', 409);
      }
      clan.name = name.trim();
    }

    if (description !== undefined) clan.description = description;
    if (banner !== undefined) clan.banner = banner;
    if (maxMembers !== undefined) clan.maxMembers = maxMembers;
    if (isPrivate !== undefined) clan.isPrivate = isPrivate;

    await clan.save();

    // Invalidate cache
    await cacheService.deletePattern(`clan:${clan._id}:*`);

    return ApiResponse.success(res, clan, 'Clan updated successfully');
  });

  kickMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const clan = await Clan.findById(req.user.clanId);

    if (!clan) {
      return ApiResponse.error(res, 'Clan not found', 404);
    }

    const userMember = clan.members.find(
      m => m.userId.toString() === req.userId.toString()
    );

    if (!userMember || (userMember.role !== CLAN_ROLES.LEADER && userMember.role !== CLAN_ROLES.ADMIN)) {
      return ApiResponse.error(res, 'Only leaders and admins can kick members', 403);
    }

    const targetMember = clan.members.find(
      m => m.userId.toString() === memberId
    );

    if (!targetMember) {
      return ApiResponse.error(res, 'Member not found', 404);
    }

    if (targetMember.role === CLAN_ROLES.LEADER) {
      return ApiResponse.error(res, 'Cannot kick clan leader', 400);
    }

    clan.members = clan.members.filter(
      m => m.userId.toString() !== memberId
    );

    await clan.save();

    // Update user
    await User.findByIdAndUpdate(memberId, { clanId: null });

    // Invalidate cache
    await cacheService.deletePattern(`clan:${clan._id}:*`);

    return ApiResponse.success(res, null, 'Member kicked successfully');
  });

  getClanDetails = asyncHandler(async (req, res) => {
    const { clanId } = req.params;

    const clan = await Clan.findById(clanId)
      .populate('members.userId', 'username profile.avatar gamification.totalPoints gamification.level');

    if (!clan) {
      return ApiResponse.error(res, 'Clan not found', 404);
    }

    // Sort members by contribution
    clan.members.sort((a, b) => (b.contributionPoints || 0) - (a.contributionPoints || 0));

    return ApiResponse.success(res, clan);
  });

  getMyClan = asyncHandler(async (req, res) => {
    if (!req.user.clanId) {
      return ApiResponse.success(res, null, 'You are not in a clan');
    }

    const clan = await Clan.findById(req.user.clanId)
      .populate('members.userId', 'username profile.avatar gamification.totalPoints gamification.level gamification.streak');

    // Sort members by contribution
    clan.members.sort((a, b) => (b.contributionPoints || 0) - (a.contributionPoints || 0));

    return ApiResponse.success(res, clan);
  });

  searchClans = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 20 } = req.query;

    const searchQuery = {
      isActive: true,
      isPrivate: false
    };

    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' };
    }

    const clans = await Clan.find(searchQuery)
      .select('name description totalPoints stats members banner')
      .sort({ totalPoints: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Clan.countDocuments(searchQuery);

    return ApiResponse.paginated(res, clans, page, limit, total);
  });

  getClanLeaderboard = asyncHandler(async (req, res) => {
    const clans = await Clan.find({ isActive: true })
      .select('name totalPoints stats banner')
      .sort({ totalPoints: -1 })
      .limit(100);

    const leaderboard = clans.map((clan, index) => ({
      rank: index + 1,
      clanId: clan._id,
      name: clan.name,
      totalPoints: clan.totalPoints,
      memberCount: clan.stats.memberCount,
      totalSessions: clan.stats.totalSessions,
      banner: clan.banner
    }));

    return ApiResponse.success(res, leaderboard);
  });
}

module.exports = new ClanController();
