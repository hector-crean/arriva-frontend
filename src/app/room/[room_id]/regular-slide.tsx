import { Slide } from "@/types/Slide";

interface RegularSlideProps {
    slide: Slide;
    content: string;
    annotations: Array<{
        id: string;
        content: string;
        position: { x: number; y: number };
        visible: boolean;
    }>;
    onRevealAnnotation: (id: string) => void;
    onHideAnnotation: (id: string) => void;
}

const RegularSlide: React.FC<RegularSlideProps> = ({
    slide,
    content,
    annotations,
    onRevealAnnotation,
    onHideAnnotation
}) => {
    return (
        <div className="w-full h-full relative">
            <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>

            <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />

            {annotations.map(annotation => (
                <div
                    key={annotation.id}
                    className={`
              absolute p-2 bg-yellow-100 border border-yellow-300 rounded shadow-md
              transition-opacity duration-300
              ${annotation.visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
                    style={{
                        left: `${annotation.position.x}%`,
                        top: `${annotation.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="text-sm">{annotation.content}</div>
                    <button
                        className="text-xs text-gray-500 mt-1"
                        onClick={() => onHideAnnotation(annotation.id)}
                    >
                        Hide
                    </button>
                </div>
            ))}

            <div className="absolute bottom-4 right-4 flex gap-2">
                {annotations.filter(a => !a.visible).map(annotation => (
                    <button
                        key={annotation.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        onClick={() => onRevealAnnotation(annotation.id)}
                    >
                        Show annotation
                    </button>
                ))}
            </div>
        </div>
    );
};
export { RegularSlide };
