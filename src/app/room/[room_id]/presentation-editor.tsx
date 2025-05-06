"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBroadcastMsg, useStorage } from '@/realtime/config';
import { PresentationOperation } from '@/types/PresentationOperation';
import { SharedPresentation } from '@/types/SharedPresentation';
import { Slide } from '@/types/Slide';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { match } from 'ts-pattern';
import { v4 as uuidv4 } from 'uuid';
import { ClientMessageType } from '@/types/ClientMessageType';

interface PresentationEditorProps {
    roomId: string;
    presentation: SharedPresentation;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
    roomId,
    presentation
}) => {
    const broadcastMsg = useBroadcastMsg();


    const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
    const [slideTitle, setSlideTitle] = useState('');
    const [slideContent, setSlideContent] = useState('');
    const [slideType, setSlideType] = useState<'Regular' | 'Video' | 'Interactive' | 'Poll'>('Regular');

    const applyOperation = (operation: PresentationOperation) => {
        const message: ClientMessageType = {
            type: 'UpdateStorage',
            data: {
                operations: [operation]
            }
        };
        broadcastMsg(message);
    };

    const startEditingSlide = (index: number) => {
        if (!presentation?.slides?.[index]) return;

        const slide = presentation.slides[index];
        setEditingSlideIndex(index);
        setSlideTitle(slide.title);

        match(slide.slide_type)
            .with({ type: 'Regular' }, (slideType) => {
                setSlideContent(slideType.data.content);
                setSlideType('Regular');
            })
            .with({ type: 'Video' }, (slideType) => {
                setSlideContent(slideType.data.url);
                setSlideType('Video');
            })
            .with({ type: 'Interactive' }, (slideType) => {
                setSlideContent(slideType.data.content);
                setSlideType('Interactive');
            })
            .with({ type: 'Poll' }, (slideType) => {
                setSlideContent(slideType.data.question);
                setSlideType('Poll');
            })
            .otherwise(() => { });
    };

    const createNewSlide = () => {
        setEditingSlideIndex(null);
        setSlideTitle('New Slide');
        setSlideContent('');
        setSlideType('Regular');
    };

    const saveSlide = () => {
        if (!presentation) return;

        let newSlide: Slide;

        const slideData = match(slideType)
            .with('Regular', () => ({
                type: 'Regular' as const,
                data: {
                    content: slideContent,
                    annotations: [],
                }
            }))
            .with('Video', () => ({
                type: 'Video' as const,
                data: {
                    url: slideContent,
                    autoplay: false,
                    current_time: 0,
                }
            }))
            .with('Interactive', () => ({
                type: 'Interactive' as const,
                data: {
                    content: slideContent,
                    interactive_elements: [],
                }
            }))
            .with('Poll', () => {
                const lines = slideContent.split('\n').filter(line => line.trim());
                const question = lines[0] || 'Question?';
                const options = lines.slice(1).length > 0 ? lines.slice(1) : ['Option 1', 'Option 2'];

                return {
                    type: 'Poll' as const,
                    data: {
                        question,
                        options,
                        results: new Array(options.length).fill(0),
                    }
                };
            })
            .exhaustive();

        newSlide = {
            id: editingSlideIndex !== null && presentation.slides?.[editingSlideIndex]
                ? presentation.slides[editingSlideIndex].id
                : uuidv4(),
            title: slideTitle,
            slide_type: slideData,
        };

        if (editingSlideIndex !== null) {
            applyOperation({
                type: 'UpdateSlide',
                data: {
                    index: editingSlideIndex,
                    slide: newSlide
                }
            });
            toast.success('Slide updated');
        } else {
            applyOperation({
                type: 'AddSlide',
                data: {
                    index: presentation?.slides?.length ?? 0,
                    slide: newSlide
                }
            });
            toast.success('Slide added');
        }

        setEditingSlideIndex(null);
        setSlideTitle('');
        setSlideContent('');
    };

    const deleteSlide = (index: number) => {
        if (confirm('Are you sure you want to delete this slide?')) {
            applyOperation({
                type: 'RemoveSlide',
                data: { index }
            });
            toast.success('Slide deleted');
        }
    };

    const renderSlideForm = () => {
        if (editingSlideIndex === null && !slideTitle && slideContent === '') {
            if (slideTitle !== 'New Slide') {
                return null;
            }
        }

        return (
            <div className="border rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">
                    {editingSlideIndex !== null ? 'Edit Slide' : 'New Slide'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Slide Title</label>
                        <Input
                            value={slideTitle}
                            onChange={(e) => setSlideTitle(e.target.value)}
                            placeholder="Enter slide title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Slide Type</label>
                        <select
                            value={slideType}
                            onChange={(e) => setSlideType(e.target.value as any)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="Regular">Regular</option>
                            <option value="Video">Video</option>
                            <option value="Interactive">Interactive</option>
                            <option value="Poll">Poll</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {match(slideType)
                                .with('Regular', () => 'Content (HTML)')
                                .with('Video', () => 'Video URL')
                                .with('Interactive', () => 'Content (HTML)')
                                .with('Poll', () => 'Question and Options (one per line)')
                                .exhaustive()}
                        </label>
                        <Textarea
                            value={slideContent}
                            onChange={(e) => setSlideContent(e.target.value)}
                            rows={5}
                            placeholder={match(slideType)
                                .with('Regular', () => 'Enter HTML content')
                                .with('Video', () => 'Enter video URL')
                                .with('Interactive', () => 'Enter HTML content')
                                .with('Poll', () => 'First line: question\nFollowing lines: options')
                                .exhaustive()}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingSlideIndex(null);
                                setSlideTitle('');
                                setSlideContent('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={saveSlide}>
                            {editingSlideIndex !== null ? 'Update Slide' : 'Add Slide'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (!presentation) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Presentation Editor</h2>
                <Button onClick={createNewSlide}>Add New Slide</Button>
            </div>

            {renderSlideForm()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presentation.slides?.map((slide, index) => (
                    <div key={slide.id} className="border rounded-lg p-4 hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{slide.title}</h3>
                            <div className="flex gap-1">
                                <button
                                    className="text-blue-500 hover:text-blue-700"
                                    onClick={() => startEditingSlide(index)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="text-red-500 hover:text-red-700 ml-2"
                                    onClick={() => deleteSlide(index)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 mb-2">
                            {match(slide.slide_type)
                                .with({ type: 'Regular' }, () => 'Regular Slide')
                                .with({ type: 'Video' }, () => 'Video Slide')
                                .with({ type: 'Interactive' }, () => 'Interactive Slide')
                                .with({ type: 'Poll' }, () => 'Poll Slide')
                                .exhaustive()}
                        </div>

                        <div className="text-sm truncate">
                            {match(slide.slide_type)
                                .with({ type: 'Regular' }, (slideType) =>
                                    (slideType.data.content || '').substring(0, 100) + (slideType.data.content?.length > 100 ? '...' : '')
                                )
                                .with({ type: 'Video' }, (slideType) =>
                                    slideType.data.url
                                )
                                .with({ type: 'Interactive' }, (slideType) =>
                                    `${(slideType.data.content || '').substring(0, 50)}${slideType.data.content?.length > 50 ? '...' : ''} (${slideType.data.interactive_elements?.length ?? 0} elements)`
                                )
                                .with({ type: 'Poll' }, (slideType) =>
                                    `${slideType.data.question} (${slideType.data.options?.length ?? 0} options)`
                                )
                                .exhaustive()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PresentationEditor;