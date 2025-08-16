import { useState, useEffect, useRef } from 'react';

interface VirtualGamepadProps {
  onGamepadInput: (gamepadState: any) => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const VirtualGamepad = ({
  onGamepadInput,
  isVisible = false,
  onToggleVisibility
}: VirtualGamepadProps) => {
  const [buttonStates, setButtonStates] = useState<{ [key: string]: boolean }>({});
  const [dpadStates, setDpadStates] = useState<{ [key: string]: boolean }>({});
  const animationRef = useRef<number | undefined>(undefined);

  // Simulate gamepad input
  useEffect(() => {
    if (!isVisible) return;

    const simulateGamepad = () => {
      const gamepadState = {
        buttons: [
          { pressed: buttonStates.buttonA || false }, // A
          { pressed: buttonStates.buttonB || false }, // B
          { pressed: buttonStates.buttonX || false }, // X
          { pressed: buttonStates.buttonY || false }, // Y
          { pressed: false }, // LB
          { pressed: false }, // RB
          { pressed: false }, // LT
          { pressed: false }, // RT
          { pressed: false }, // Start
          { pressed: false }, // Select
          { pressed: false }, // L3
          { pressed: false }, // R3
          { pressed: dpadStates.dpadUp || false }, // D-pad Up
          { pressed: dpadStates.dpadDown || false }, // D-pad Down
          { pressed: dpadStates.dpadLeft || false }, // D-pad Left
          { pressed: dpadStates.dpadRight || false } // D-pad Right
        ],
        axes: [0, 0, 0, 0], // Left stick X, Y, Right stick X, Y
        id: 'Virtual Gamepad',
        index: 0,
        connected: true,
        timestamp: Date.now(),
        mapping: 'standard'
      };

      onGamepadInput(gamepadState);
      animationRef.current = requestAnimationFrame(simulateGamepad);
    };

    simulateGamepad();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, buttonStates, dpadStates, onGamepadInput]);

  const handleButtonPress = (button: string, pressed: boolean) => {
    setButtonStates((prev) => ({ ...prev, [button]: pressed }));
  };

  const handleDpadPress = (direction: string, pressed: boolean) => {
    setDpadStates((prev) => ({ ...prev, [direction]: pressed }));
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        🎮 Virtual Gamepad
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Virtual Gamepad</h3>
        <button onClick={onToggleVisibility} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      {/* D-Pad */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">D-Pad</div>
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onMouseDown={() => handleDpadPress('dpadUp', true)}
            onMouseUp={() => handleDpadPress('dpadUp', false)}
            onMouseLeave={() => handleDpadPress('dpadUp', false)}
            className={`w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 transition-colors ${
              dpadStates.dpadUp ? 'bg-yellow-500' : ''
            }`}
          >
            ↑
          </button>
          <div></div>
          <button
            onMouseDown={() => handleDpadPress('dpadLeft', true)}
            onMouseUp={() => handleDpadPress('dpadLeft', false)}
            onMouseLeave={() => handleDpadPress('dpadLeft', false)}
            className={`w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 transition-colors ${
              dpadStates.dpadLeft ? 'bg-yellow-500' : ''
            }`}
          >
            ←
          </button>
          <div className="w-12 h-12"></div>
          <button
            onMouseDown={() => handleDpadPress('dpadRight', true)}
            onMouseUp={() => handleDpadPress('dpadRight', false)}
            onMouseLeave={() => handleDpadPress('dpadRight', false)}
            className={`w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 transition-colors ${
              dpadStates.dpadRight ? 'bg-yellow-500' : ''
            }`}
          >
            →
          </button>
          <div></div>
          <button
            onMouseDown={() => handleDpadPress('dpadDown', true)}
            onMouseUp={() => handleDpadPress('dpadDown', false)}
            onMouseLeave={() => handleDpadPress('dpadDown', false)}
            className={`w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 transition-colors ${
              dpadStates.dpadDown ? 'bg-yellow-500' : ''
            }`}
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Action Buttons</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onMouseDown={() => handleButtonPress('buttonA', true)}
            onMouseUp={() => handleButtonPress('buttonA', false)}
            onMouseLeave={() => handleButtonPress('buttonA', false)}
            className={`w-16 h-12 rounded bg-green-600 hover:bg-green-500 transition-colors ${
              buttonStates.buttonA ? 'bg-green-400' : ''
            }`}
          >
            A
          </button>
          <button
            onMouseDown={() => handleButtonPress('buttonB', true)}
            onMouseUp={() => handleButtonPress('buttonB', false)}
            onMouseLeave={() => handleButtonPress('buttonB', false)}
            className={`w-16 h-12 rounded bg-red-600 hover:bg-red-500 transition-colors ${
              buttonStates.buttonB ? 'bg-red-400' : ''
            }`}
          >
            B
          </button>
          <button
            onMouseDown={() => handleButtonPress('buttonX', true)}
            onMouseUp={() => handleButtonPress('buttonX', false)}
            onMouseLeave={() => handleButtonPress('buttonX', false)}
            className={`w-16 h-12 rounded bg-blue-600 hover:bg-blue-500 transition-colors ${
              buttonStates.buttonX ? 'bg-blue-400' : ''
            }`}
          >
            X
          </button>
          <button
            onMouseDown={() => handleButtonPress('buttonY', true)}
            onMouseUp={() => handleButtonPress('buttonY', false)}
            onMouseLeave={() => handleButtonPress('buttonY', false)}
            className={`w-16 h-12 rounded bg-yellow-600 hover:bg-yellow-500 transition-colors ${
              buttonStates.buttonY ? 'bg-yellow-400' : ''
            }`}
          >
            Y
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-400">
        <div>Click and hold buttons to simulate gamepad input</div>
        <div>
          D-Pad Up/Down: Navigate | D-Pad Left/Right: Decrease/Increase | A: Hold to Confirm | B:
          Cancel | X: Decrease | Y: Increase
        </div>
      </div>
    </div>
  );
};
