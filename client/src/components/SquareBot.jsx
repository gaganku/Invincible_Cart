import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './SquareBot.css';

function SquareBot() {
  // Start at bottom-right (handled by CSS), offset tracks movement
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [emotion, setEmotion] = useState('happy'); // happy, curious, blink
  const [isReturning, setIsReturning] = useState(false);
  const [message, setMessage] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const [products, setProducts] = useState([]);
  
  const botRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const hasMoved = useRef(false);
  const idleTimer = useRef(null);
  const messageTimer = useRef(null);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Bot failed to fetch products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Greeting logic
  const showRandomMessage = () => {
    // If no products yet, show generic greeting
    if (products.length === 0) {
      setMessage("Hello there! 👋");
      setShowBubble(true);
      setEmotion('happy');
      setTimeout(() => setShowBubble(false), 4000);
      return;
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const prompts = [
      `Have you seen the ${randomProduct.name}? It's amazing! 🌟`,
      `Don't miss out on ${randomProduct.name}! 🔥`,
      `I love the ${randomProduct.name}, you should check it out! 🤖`,
      `Best seller alert: ${randomProduct.name}! 📦`,
      `Need something new? Try ${randomProduct.name}! ✨`
    ];
    
    const randomMsg = prompts[Math.floor(Math.random() * prompts.length)];
    setMessage(randomMsg);
    setShowBubble(true);
    setEmotion('happy');

    // Hide after 4 seconds
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => {
      setShowBubble(false);
    }, 4000);
  };

  const startDrag = (e) => {
    e.preventDefault();
    isMouseDown.current = true;
    hasMoved.current = false;
    setEmotion('curious');
    setShowBubble(false); // Hide bubble when dragging
    
    // Clear any existing idle timer
    if (idleTimer.current) clearTimeout(idleTimer.current);
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    initialOffset.current = { x: offset.x, y: offset.y };
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current) return;
    e.preventDefault();
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;
    
    const newX = initialOffset.current.x + deltaX;
    const newY = initialOffset.current.y + deltaY;
    
    // Threshold to detect actual dragging vs clicking
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      if (!hasMoved.current) {
        hasMoved.current = true;
        setIsDragging(true);
      }
    }
    
    if (hasMoved.current) {
      setOffset({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    const wasDragging = hasMoved.current;
    const wasMouseDown = isMouseDown.current;
    
    isMouseDown.current = false;
    hasMoved.current = false;
    setIsDragging(false);
    setEmotion('happy');
    
    // CLICK DETECTED: If we started clicking on bot and didn't drag, it's a click
    if (wasMouseDown && !wasDragging) {
      showRandomMessage();
    }
    
    // If we moved, set a timer to return home
    if (wasDragging && (offset.x !== 0 || offset.y !== 0)) {
      idleTimer.current = setTimeout(() => {
        setIsReturning(true);
        setOffset({ x: 0, y: 0 }); // Go home
        
        // Reset returning state after animation
        setTimeout(() => {
          setIsReturning(false);
        }, 600);
      }, 5000);
    }
  };

  useEffect(() => {
    const handleMove = (e) => handleMouseMove(e);
    const handleUp = () => handleMouseUp();
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    const botElement = botRef.current;
    if (botElement) {
      const handleTouchStart = (e) => startDrag(e);
      botElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
        botElement.removeEventListener('touchstart', handleTouchStart);
      };
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [offset]);

  return (
    <div
      ref={botRef}
      className={`square-bot ${isDragging ? 'dragging' : ''} ${isReturning ? 'returning' : ''} emotion-${emotion}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      onMouseDown={startDrag}
    >
      {showBubble && (
        <div className="bot-speech-bubble">
          {message}
        </div>
      )}
      <div className="bot-antenna">
        <div className="antenna-ball"></div>
      </div>
      <div className="bot-face">
        <div className="bot-eye left">
          <div className="pupil"></div>
          <div className="shine"></div>
        </div>
        <div className="bot-eye right">
          <div className="pupil"></div>
          <div className="shine"></div>
        </div>
      </div>
    </div>
  );
}

export default SquareBot;
