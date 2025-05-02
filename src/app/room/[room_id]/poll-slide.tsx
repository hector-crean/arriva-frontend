import { Button } from "@/components/ui/button";
import { Slide } from "@/types/Slide";

interface PollSlideProps {
    slide: Slide;
    question: string;
    options: string[];
    results: number[];
    onVote: (optionIndex: number) => void;
}

const PollSlide: React.FC<PollSlideProps> = ({
    slide,
    question,
    options,
    results,
    onVote
}) => {
    const totalVotes = results.reduce((sum, count) => sum + count, 0);

    return (
        <div className="w-full h-full">
            <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>

            <div className="text-xl mb-6">{question}</div>

            <div className="space-y-4">
                {options.map((option, index) => {
                    const voteCount = results[index] || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                    return (
                        <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex justify-between mb-2">
                                <div className="font-medium">{option}</div>
                                <div className="text-gray-500">{voteCount} votes ({percentage}%)</div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            <Button
                                className="mt-2 w-full"
                                variant="outline"
                                onClick={() => onVote(index)}
                            >
                                Vote
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export { PollSlide };

