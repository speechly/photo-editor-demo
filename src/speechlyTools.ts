import {Segment, Entity} from "@speechly/browser-client";
import {CanvasEditor} from './CanvasEditor';

const entity2canonical: { [key: string]: string; } = {
    "sepia": "sepia",
    "vintage": "vintage",
    "classic": "vintage",
    "faded": "sepia",
    "grayscale": "grayscale",
    "black and white": "grayscale",
    "kodachrome": "kodachrome",
    "technicolor": "technicolor",
    "polaroid": "polaroid",
    'luminosity': 'brightness',
    'brightness': 'brightness',
    'light': 'brightness',
    'contrast': 'contrast',
    'saturation': 'saturation',
    'color': 'saturation'
}

const updateImageEditorBySegmentChange = (segment: Segment, imageEditor: CanvasEditor) => {
    if (!segment.isFinal) {
        return
    }
    if (segment.intent.intent.length > 0) {
        const intent = segment.intent;
        if (intent.intent === "undo") {
            imageEditor.undo();
        } else if (intent.intent === "add_filter") {
            const filterName = collectEntity(segment.entities, "filter");
            if (filterName in entity2canonical) {
                imageEditor.enableFilter(entity2canonical[filterName]);
            }
        } else if (intent.intent === "remove_filter") {
            const filterName = collectEntity(segment.entities, "filter");
            if (filterName in entity2canonical) {
                imageEditor.disableFilter(entity2canonical[filterName]);
            }
        } else if (intent.intent === "increase") {
            const propertyName = collectEntity(segment.entities, "property");
            if (propertyName in entity2canonical) {
                imageEditor.incrementProperty(entity2canonical[propertyName]);
            }
        } else if (intent.intent === "decrease") {
            const propertyName = collectEntity(segment.entities, "property");
            if (propertyName in entity2canonical) {
                imageEditor.decrementProperty(entity2canonical[propertyName]);
            }
        }
    }
};

const collectEntity = (entityList: Entity[], entityType: string) => {
    const entities = entityList.filter(item => item.type === entityType);
    if (entities.length > 0) {
        // In our case there should only be a single entity of a given type in a segment,
        // so we just return the first item on the list if it exists.
        return entities[0].value.toLowerCase();
    }
    return '';
}

export default updateImageEditorBySegmentChange;