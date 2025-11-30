#!/usr/bin/env node
// Simple smoke test script for backend session APIs.
// Usage: node backend/scripts/e2e_smoke.js

const BASE = process.env.BASE_URL || 'http://localhost:5001'

function rand(n=6){ return Math.random().toString(36).substring(2,2+n) }

async function run(){
  try{
    console.log('Base URL:', BASE)
    const email = `e2e_${rand(4)}@example.com`
    const password = `P@ss${rand(4)}!`
    const username = `e2e_${rand(3)}`

    console.log('Registering user', email)
    let r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: {'content-type':'application/json'},
      body: JSON.stringify({ email, password, username })
    })
    const reg = await r.json()
    if (!r.ok) throw new Error('register failed: '+ (reg.message || r.status))
    console.log('Registered OK')

    console.log('Logging in')
    r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST', headers: {'content-type':'application/json'},
      body: JSON.stringify({ email, password })
    })
    const login = await r.json()
    if (!r.ok) throw new Error('login failed: '+ (login.message || r.status))
    const token = login.data?.accessToken || login.data?.token || login.token || login.accessToken
    if (!token) throw new Error('no token in login response')
    console.log('Login OK, token length:', token.length)

    // Start session
    console.log('Starting session')
    r = await fetch(`${BASE}/api/sessions`, {
      method: 'POST', headers: {'content-type':'application/json','authorization':`Bearer ${token}`},
      body: JSON.stringify({ tags:['e2e'], notes:'smoke test' })
    })
    const start = await r.json()
    if (!r.ok) throw new Error('start session failed: '+ (start.message || r.status))
    const session = start.data
    console.log('Session started:', session._id)

    // Pause session
    console.log('Pausing session')
    r = await fetch(`${BASE}/api/sessions/${session._id}/pause`, {
      method: 'POST', headers: {'content-type':'application/json','authorization':`Bearer ${token}`},
      body: JSON.stringify({ reason: 'e2e_test_pause' })
    })
    const pause = await r.json()
    if (!r.ok) throw new Error('pause failed: '+ (pause.message || r.status))
    console.log('Paused OK')

    // Check active session
    console.log('Checking active session (should be none)')
    r = await fetch(`${BASE}/api/sessions/active`, { headers: {'authorization':`Bearer ${token}`} })
    const active = await r.json()
    console.log('Active session response status:', r.status)
    console.log('Active data:', active.data || active)

    console.log('E2E smoke test completed successfully')
    process.exit(0)
  } catch(err){
    console.error('E2E smoke failed:', err.message || err)
    process.exit(2)
  }
}

run()
