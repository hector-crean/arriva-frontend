import { Button } from "@/components/ui/button";
import { Slide } from "@/types/Slide";
import { useEffect, useRef } from "react";

interface VideoSlideProps {
    slide: Slide;
    url: string;
    autoplay: boolean;
    currentTime: number;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (time: number) => void;
}

const VideoSlide: React.FC<VideoSlideProps> = ({
    slide,
    url,
    autoplay,
    currentTime,
    onPlay,
    onPause,
    onSeek
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = currentTime;

            if (autoplay) {
                videoRef.current.play().catch(err => console.error('Failed to autoplay:', err));
            } else {
                videoRef.current.pause();
            }
        }
    }, [autoplay, currentTime]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            onSeek(videoRef.current.currentTime);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>

            <div className="flex-1 flex items-center justify-center">
                <video
                    ref={videoRef}
                    src={url}
                    className="max-w-full max-h-[300px]"
                    controls={false}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={onPlay}
                    onPause={onPause}
                />
            </div>

            <div className="flex justify-center gap-4 mt-4">
                <Button onClick={onPlay}>Play</Button>
                <Button onClick={onPause}>Pause</Button>
                <input
                    type="range"
                    min="0"
                    max={videoRef.current?.duration || 100}
                    value={currentTime}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="w-64"
                />
            </div>
        </div>
    );
};

export { VideoSlide };

