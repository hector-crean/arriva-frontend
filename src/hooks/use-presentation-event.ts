import { PresentationOperation } from '@/types/PresentationOperation';
import { ServerMessageType } from '@/types/ServerMessageType';
import { SharedPresentation } from '@/types/SharedPresentation';
import { useCallback, useReducer } from 'react';
import { useRoomEvent } from './use-room-event';

// Initial state
const initialState: SharedPresentation = {
  slides: [],
  current_slide_index: 0,
  version: BigInt(0),
};

// Reducer function
function presentationReducer(state: SharedPresentation, action: PresentationOperation): SharedPresentation {
  switch (action.type) {
    case 'GoToNextSlide':
      return {
        ...state,
        current_slide_index: Math.min(state.current_slide_index + 1, state.slides.length - 1),
      };
    case 'GoToPreviousSlide':
      return {
        ...state,
        current_slide_index: Math.max(state.current_slide_index - 1, 0),
      };
    case 'GoToSlide':
      return {
        ...state,
        current_slide_index: action.data.index,
      };
    case 'AddSlide':
      return {
        ...state,
        slides: [...state.slides, action.data.slide],
      };
    case 'RemoveSlide':
      return {
        ...state,
        slides: state.slides.filter((_, index) => index !== action.data.index),
        // Adjust current_slide_index if needed
        current_slide_index: state.current_slide_index >= action.data.index && state.current_slide_index > 0 
          ? state.current_slide_index - 1 
          : state.current_slide_index,
      };
 
    default:
      return state;
  }
}

interface UsePresentationEventProps {
  roomId: string;
}

export function usePresentationEvent({ roomId }: UsePresentationEventProps) {
  const [state, dispatch] = useReducer(presentationReducer, initialState);
  
  const { readyState, sendMessage } = useRoomEvent({
    roomId,
    onMessage: useCallback((message: ServerMessageType) => {
      // Handle presentation-specific messages
      switch (message.type) {
        case 'StorageUpdated':
          if (message.data && message.data.operations) {
            message.data.operations.forEach((operation) => {
              dispatch(operation);
            });
            
          
          }
          break;
        // Handle other presentation-specific message types
        case 'RoomJoined':
          console.log('Joined room:', message.data.room_id);
          break;
        case 'RoomLeft':
          console.log('Left room:', message.data.room_id);
          break;
      }
    }, []),
  });

  // Function to send presentation operations to the server
  const updatePresentation = useCallback((operation: PresentationOperation) => {
    // Apply operation locally first (optimistic update)
    dispatch(operation);
    
    // Send operation to server
    sendMessage({
      type: 'UpdatedStorage',
      data: {
        operations: [operation]
      }
    });
  }, [sendMessage]);

  return {
    state,
    readyState,
    updatePresentation,
    goToNextSlide: useCallback(() => {
      updatePresentation({ type: 'GoToNextSlide' });
    }, [updatePresentation]),
    goToPreviousSlide: useCallback(() => {
      updatePresentation({ type: 'GoToPreviousSlide' });
    }, [updatePresentation]),
    goToSlide: useCallback((index: number) => {
      updatePresentation({ 
        type: 'GoToSlide', 
        data: { index } 
      });
    }, [updatePresentation]),
    addSlide: useCallback((slide: any) => {
      updatePresentation({ 
        type: 'AddSlide', 
        data: { slide } 
      });
    }, [updatePresentation]),
    removeSlide: useCallback((index: number) => {
      updatePresentation({ 
        type: 'RemoveSlide', 
        data: { index } 
      });
    }, [updatePresentation]),
  };
}