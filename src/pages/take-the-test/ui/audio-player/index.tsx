import { memo, useEffect, useLayoutEffect, useRef } from "react";
import "plyr-react/plyr.css";

interface AudioPlayerProps {
  audioUrl: string;
  isReady: boolean;
  onTimeUpdate?: (currentTime: number) => void;
}

const AudioPlayer = ({ audioUrl, isReady, onTimeUpdate }: AudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plyrInstanceRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  // Use useLayoutEffect to ensure ref is ready before initialization
  useLayoutEffect(() => {
    if (isInitializedRef.current) return; // Already initialized
    
    const initPlayer = async () => {
      if (!containerRef.current) {
        console.log("Container ref not ready");
        return;
      }

      try {
        // Create audio element
        const audioElement = document.createElement("audio");
        audioElement.controls = true;
        audioElement.src = audioUrl;
        audioElementRef.current = audioElement;
        
        // Append to container
        containerRef.current.appendChild(audioElement);

        // Dynamically import Plyr
        const Plyr = (await import("plyr")).default;
        
        // Initialize Plyr
        plyrInstanceRef.current = new Plyr(audioElement, {
          controls: [
            "rewind",
            "play",
            "fast-forward",
            "progress",
            "current-time",
            "mute",
            "volume",
            "settings",
          ],
        });

        // Setup time update listener
        audioElement.addEventListener("timeupdate", () => {
          if (onTimeUpdate) {
            onTimeUpdate(audioElement.currentTime);
          }
        });

        isInitializedRef.current = true;
        console.log("Audio player initialized successfully");
      } catch (error) {
        console.error("Failed to initialize audio player:", error);
      }
    };

    initPlayer();

    // Cleanup only on unmount
    return () => {
      if (plyrInstanceRef.current) {
        try {
          plyrInstanceRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
        plyrInstanceRef.current = null;
      }
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        try {
          audioElementRef.current.parentNode.removeChild(audioElementRef.current);
        } catch (e) {
          console.error("Error removing audio element:", e);
        }
        audioElementRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []); // Empty deps - only run once

  // Handle play when ready
  useEffect(() => {
    if (isReady && audioElementRef.current) {
      const audioElement = audioElementRef.current;
      
      if (audioElement.paused) {
        audioElement.play().catch((error) =>
          console.error("Audio play failed:", error)
        );
      }
    }
  }, [isReady]);

  return <div ref={containerRef} />;
};

// Memo to prevent re-render
export default memo(AudioPlayer);
