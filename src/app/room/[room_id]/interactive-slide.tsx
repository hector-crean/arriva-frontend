import { Slide } from "@/types/Slide";
import { match } from "ts-pattern";

interface InteractiveSlideProps {
    slide: Slide;
    content: string;
    elements: Array<{
        id: string;
        element_type: string;
        properties: any;
        position: { x: number; y: number };
    }>;
}

const InteractiveSlide: React.FC<InteractiveSlideProps> = ({
    slide,
    content,
    elements
}) => {
    const renderInteractiveElement = (element: {
        id: string;
        element_type: string;
        properties: any;
        position: { x: number; y: number };
    }) => {
        return match(element.element_type)
            .with('button', () => (
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    style={{
                        position: 'absolute',
                        left: `${element.position.x}%`,
                        top: `${element.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => console.log('Button clicked:', element.properties)}
                >
                    {element.properties.label || 'Button'}
                </button>
            ))
            .with('input', () => (
                <input
                    type="text"
                    placeholder={element.properties.placeholder || 'Enter text...'}
                    className="px-3 py-2 border rounded"
                    style={{
                        position: 'absolute',
                        left: `${element.position.x}%`,
                        top: `${element.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))
            .with('image', () => (
                <img
                    src={element.properties.src || ''}
                    alt={element.properties.alt || ''}
                    className="max-w-full max-h-full object-contain"
                    style={{
                        position: 'absolute',
                        left: `${element.position.x}%`,
                        top: `${element.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: element.properties.width || 'auto',
                        height: element.properties.height || 'auto'
                    }}
                />
            ))
            .otherwise(() => (
                <div
                    className="p-2 bg-gray-100 border rounded"
                    style={{
                        position: 'absolute',
                        left: `${element.position.x}%`,
                        top: `${element.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    Unknown element: {element.element_type}
                </div>
            ));
    };

    return (
        <div className="w-full h-full relative">
            <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>

            <div className="prose mb-4" dangerouslySetInnerHTML={{ __html: content }} />

            <div className="relative w-full h-[300px] border rounded bg-gray-50">
                {elements.map(element => (
                    <div key={element.id}>
                        {renderInteractiveElement(element)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export { InteractiveSlide };

