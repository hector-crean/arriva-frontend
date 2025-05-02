"use client";
import { Button } from '@/components/ui/button';
import { useRoomEvent } from '@/hooks/use-room-event';
import { PresentationOperation } from '@/types/PresentationOperation';
import { SharedPresentation } from '@/types/SharedPresentation';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { InteractiveSlide } from './interactive-slide';
import { PollSlide } from './poll-slide';
import { RegularSlide } from './regular-slide';
import { VideoSlide } from './video-slide';

interface PresentationViewerProps {
    roomId: string;
    initialPresentation: SharedPresentation;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
    roomId,
    initialPresentation
}) => {
    const { room_id } = useParams<{ room_id: string }>();
    const { sendMessage, message } = useRoomEvent({ roomId });

    const queryClient = useQueryClient();


    const [draftPresentation, setDraftPresentation] = useState<SharedPresentation>(initialPresentation);


    useEffect(() => {
        if (initialPresentation) {
            setDraftPresentation(initialPresentation);
        }
    }, [initialPresentation])

    // Merge server state with realtime updates




    const currentSlide = draftPresentation.slides[draftPresentation.current_slide_index];

    useEffect(() => {
        if (message) {
            if (message.type === 'StorageUpdated') {
                queryClient.invalidateQueries({ queryKey: ['room', roomId, 'storage'] });
            }
        }
    }, [message])


    const applyOperation = (operation: PresentationOperation) => {
        sendMessage({
            type: 'UpdatedStorage',
            data: {
                operations: [operation]
            }
        });
    };

    // Navigation handlers
    const goToNextSlide = () => applyOperation({ type: 'GoToNextSlide' });
    const goToPreviousSlide = () => applyOperation({ type: 'GoToPreviousSlide' });
    const goToSlide = (index: number) => applyOperation({ type: 'GoToSlide', data: { index } });

    // Slide content handlers
    const revealAnnotation = (annotationId: string) => {
        applyOperation({
            type: 'RevealAnnotation',
            data: {
                slide_index: draftPresentation.current_slide_index,
                annotation_id: annotationId
            }
        });

    };

    const hideAnnotation = (annotationId: string) => {
        applyOperation({
            type: 'HideAnnotation',
            data: {
                slide_index: draftPresentation.current_slide_index,
                annotation_id: annotationId
            }
        });

    };

    // Video control handlers
    const playVideo = () => {
        applyOperation({
            type: 'PlayVideo',
            data: { slide_index: draftPresentation.current_slide_index }
        });

    };

    const pauseVideo = () => {
        applyOperation({
            type: 'PauseVideo',
            data: { slide_index: draftPresentation.current_slide_index }
        });

    };

    const seekVideo = (time: number) => {
        applyOperation({
            type: 'SeekVideo',
            data: {
                slide_index: draftPresentation.current_slide_index,
                time
            }
        });

    };

    // Poll voting handler
    const voteOnPoll = (optionIndex: number) => {
        applyOperation({
            type: 'VoteOnPoll',
            data: {
                slide_index: draftPresentation.current_slide_index,
                option_index: optionIndex
            }
        });

    };


    // Render the current slide based on its type
    const renderCurrentSlide = () => {
        if (!currentSlide) return <div className="text-center p-8">No slide available</div>;

        return match(currentSlide.slide_type)
            .with({ type: 'Regular' }, (slideType) => (
                <RegularSlide
                    slide={currentSlide}
                    content={slideType.data.content}
                    annotations={slideType.data.annotations}
                    onRevealAnnotation={revealAnnotation}
                    onHideAnnotation={hideAnnotation}
                />
            ))
            .with({ type: 'Video' }, (slideType) => (
                <VideoSlide
                    slide={currentSlide}
                    url={slideType.data.url}
                    autoplay={slideType.data.autoplay}
                    currentTime={slideType.data.current_time}
                    onPlay={playVideo}
                    onPause={pauseVideo}
                    onSeek={seekVideo}
                />
            ))
            .with({ type: 'Interactive' }, (slideType) => (
                <InteractiveSlide
                    slide={currentSlide}
                    content={slideType.data.content}
                    elements={slideType.data.interactive_elements}
                />
            ))
            .with({ type: 'Poll' }, (slideType) => (
                <PollSlide
                    slide={currentSlide}
                    question={slideType.data.question}
                    options={slideType.data.options}
                    results={slideType.data.results}
                    onVote={voteOnPoll}
                />
            ))
            .otherwise(() => <div>Unknown slide type</div>);
    };

    // Render slide navigation
    const renderNavigation = () => {
        if (!draftPresentation || draftPresentation.slides.length === 0) return null;

        return (
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
                <Button
                    onClick={goToPreviousSlide}
                    disabled={draftPresentation.current_slide_index === 0}
                >
                    Previous
                </Button>

                <div className="flex-1 text-center">
                    Slide {draftPresentation.current_slide_index + 1} of {draftPresentation.slides.length}
                </div>

                <Button
                    onClick={goToNextSlide}
                    disabled={draftPresentation.current_slide_index >= draftPresentation.slides.length - 1}
                >
                    Next
                </Button>
            </div>
        );
    };

    // Render slide thumbnails for quick navigation
    const renderThumbnails = () => {
        if (!draftPresentation || draftPresentation.slides.length === 0) return null;

        return (
            <div className="flex overflow-x-auto gap-2 p-2 bg-gray-50 rounded-md">
                {draftPresentation.slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`
              flex-shrink-0 w-24 h-16 border-2 cursor-pointer
              ${index === draftPresentation.current_slide_index ? 'border-blue-500' : 'border-gray-300'}
            `}
                        onClick={() => goToSlide(index)}
                    >
                        <div className="text-xs p-1 truncate">{slide.title}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {renderNavigation()}

            <div className="border rounded-lg shadow-lg p-4 min-h-[400px] flex items-center justify-center">
                {renderCurrentSlide()}
            </div>

            {renderThumbnails()}
        </div>
    );
};

export default PresentationViewer;