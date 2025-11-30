import { useState, useRef } from 'react';

export default function DraggableWidget({ title, children, id = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    // Only drag from header
    if (e.target.closest('.widget-handle')) {
      setIsDragging(true);
      startPosRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragRef.current) return;

    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;

    // Keep widget within viewport
    const maxX = window.innerWidth - dragRef.current.offsetWidth;
    const maxY = window.innerHeight - dragRef.current.offsetHeight;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Only enable drag on mobile or when shift is held
  const isDragEnabled = typeof window !== 'undefined' && (window.innerWidth < 768);

  return (
    <div
      ref={dragRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={isDragEnabled ? {
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      } : {}}
      className={`${isDragEnabled ? 'fixed z-50' : 'relative'}`}
    >
      <div className={`glass rounded-2xl overflow-hidden ${isDragEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        {title && (
          <div
            className={`widget-handle p-4 border-b border-white/10 ${isDragEnabled ? 'cursor-grab' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{title}</h3>
              {isDragEnabled && (
                <div className="text-white/40 text-xs">
                  ⋮⋮
                </div>
              )}
            </div>
          </div>
        )}
        <div className={title ? 'p-4' : ''}>
          {children}
        </div>
      </div>
    </div>
  );
}
