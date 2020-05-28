import {fabric} from 'fabric';
import { Canvas as FabricCanvas } from 'fabric/fabric-impl';


interface EditorState {
    [name: string]: number;
}

interface Operator {
    type: string;
    name: string;
    value: number;
}

export class CanvasEditor {
    editorHTMLDiv: HTMLDivElement;
    imageUrl: string;
    canvas: FabricCanvas;
    htmlCanvas: HTMLCanvasElement;
    operatorStack: Operator[];
    imageObject: fabric.Image;
    stepSize: Map<string, number> = new Map<string, number>();

    constructor(editorHTMLDiv: HTMLDivElement, imageUrl: string) {
        this.editorHTMLDiv = editorHTMLDiv;
        this.imageUrl = imageUrl;

        this.htmlCanvas = document.createElement('canvas');
        this.htmlCanvas.id = "canvas";
        this.resize();
        this.editorHTMLDiv.appendChild(this.htmlCanvas);

        fabric.Object.prototype.transparentCorners = false;

        const canvas = new fabric.Canvas(this.htmlCanvas);
        this.canvas = canvas;
        this.imageObject = new fabric.Image();
        const outerScope = this;
        fabric.Image.fromURL(imageUrl, function(img: fabric.Image) {
            if (img) {
                outerScope.imageObject = img;
                const oImg = resizeElements(img, canvas);
                outerScope.canvas.add(oImg);
            }
        });

        this.stepSize.set('brightness', 0.1);
        this.stepSize.set('contrast', 0.1);
        this.stepSize.set('saturation', 0.2);

        this.operatorStack = []
    }

    public incrementProperty = (propertyName: string) => {
        console.log('incrementProperty ' + propertyName)
        let tmp = this.stepSize.get(propertyName)
        this.operatorStack.push({type: 'property',
                                 name: propertyName,
                                 value: (tmp) ? tmp : 0});
        this.updateImage();
    }

    public decrementProperty = (propertyName: string) => {
        console.log('decrementProperty ' + propertyName)
        let tmp = this.stepSize.get(propertyName)
        this.operatorStack.push({type: 'property',
                                 name: propertyName,
                                 value: (tmp) ? -1*tmp : 0});
        this.updateImage();
    }

    public enableFilter = (filterName: string) => {
        console.log('enableFilter ' + filterName)
        this.operatorStack.push({type: 'filter',
                                  name: filterName,
                                  value: 1});
        this.updateImage();
    }

    public disableFilter = (filterName: string) => {
        console.log('disableFilter ' + filterName)
        this.operatorStack.push({type: 'filter',
                                  name: filterName,
                                  value: 0});
        this.updateImage();
    }

    public undo = () => {
        console.log('at undo');
        this.operatorStack.pop();
        this.updateImage();
    }

    private updateImage = () => {
        console.log(this.operatorStack);
        let state: EditorState = this.buildEditorState();
        console.log(state);
        this.imageObject.filters = [];

        if (state.brightness !== 0.0) {
            let filter = new fabric.Image.filters.Brightness({brightness: state.brightness});
            this.imageObject.filters.push(filter);
        }

        if (state.contrast !== 0.0) {
            let filter = new fabric.Image.filters.Contrast({contrast: state.contrast});
            this.imageObject.filters.push(filter);
        }

        if (state.saturation !== 0.0) {
            let filter = new fabric.Image.filters.Saturation({saturation: state.saturation});
            this.imageObject.filters.push(filter);
        }

        if (state.kodachrome > 0) {
            let filter = this.makeKodachromeFilter();
            this.imageObject.filters.push(filter);
        }

        if (state.vintage > 0) {
            let filter = this.makeVintageFilter();
            this.imageObject.filters.push(filter);
        }

        if (state.technicolor > 0) {
            let filter = this.makeTechnicolorFilter();
            this.imageObject.filters.push(filter);
        }

        if (state.polaroid > 0) {
            let filter = this.makePolaroidFilter();
            this.imageObject.filters.push(filter);
        }

        if (state.sepia > 0) {
            let filter = new fabric.Image.filters.Sepia();
            this.imageObject.filters.push(filter);
        }

        if (state.grayscale > 0) {
            let filter = new fabric.Image.filters.Grayscale();
            this.imageObject.filters.push(filter);
        }

        this.imageObject.applyFilters()
        this.canvas.renderAll()
    }

    private buildEditorState = (): EditorState => {
        // const state = new EditorState();
        let state: EditorState = this.cleanEditorState();
        for (let op of this.operatorStack) {
            if (op.type === 'property') {
                state[op.name] += op.value;
            }
            else if (op.type === 'filter') {
                state[op.name] = op.value;
            }
        }
        return state;
    }

    private cleanEditorState = (): EditorState => {
        return {
            brightness: 0.0,
            contrast: 0.0,
            saturation: 0.0,
            grayscale: 0,
            kodachrome: 0,
            vintage: 0,
            sepia: 0,
            technicolor: 0,
            polaroid: 0
        };
    }

    private resize = () => {
        const w = window.innerWidth
        const h = window.innerHeight
        this.htmlCanvas.width = w
        this.htmlCanvas.height = h
        this.htmlCanvas.style.width = `${w}px`
        this.htmlCanvas.style.height = `${h}px - 60px`
    }

    private makeKodachromeFilter = () : fabric.IBaseFilter => {
        console.log('at makeKodachromeFilter')
        return new fabric.Image.filters.ColorMatrix({
            matrix: [
                1.1285582396593525, -0.3967382283601348, -0.03992559172921793, 0, 63.72958762196502,
                -0.16404339962244616, 1.0835251566291304, -0.05498805115633132, 0, 24.732407896706203,
                -0.16786010706155763, -0.5603416277695248, 1.6014850761964943, 0, 35.62982807460946,
                0, 0, 0, 1, 0
            ]
        });
    }

    private makeVintageFilter = () : fabric.IBaseFilter => {
        console.log('at makeVintageFilter')
        return new fabric.Image.filters.ColorMatrix({
            matrix: [
                0.62793,0.32021,-0.03965,0,0.03784,
                0.02578,0.64411,0.03259,0,0.02926,
                0.04660,-0.08512,0.52416,0,0.02023,
                0,0,0,1,0
            ]
        });
    }


    private makeTechnicolorFilter = () : fabric.IBaseFilter => {
        console.log('at makeTechnicolorFilter')
        return new fabric.Image.filters.ColorMatrix({
            matrix: [
                1.91252,-0.85453,-0.09155,0,0.04624,
                -0.30878,1.76589,-0.10601,0,-0.27589,
                -0.23110,-0.75018,1.84759,0,0.12137,
                0,0,0,1,0
            ]
        });
    }


    private makePolaroidFilter = () : fabric.IBaseFilter => {
        console.log('at makePolaroidFilter')
        return new fabric.Image.filters.ColorMatrix({
            matrix: [
                1.438,-0.062,-0.062,0,0,
                -0.122,1.378,-0.122,0,0,
                -0.016,-0.016,1.483,0,0,
                0,0,0,1,0
            ]
        });
    }
}


const resizeElements = (img: fabric.Image,
                        canvas: fabric.Canvas) : fabric.Image => {
    const imageScaler = 0.7 // make it slightly smaller
    const imageOriginalHeight = img.height || 1000;
    const imageOriginalWidth = img.width || 1000;
    const imgRatio = imageOriginalHeight/ imageOriginalWidth;
    const winRatio = window.innerHeight / window.innerWidth;
    const container = document.getElementsByClassName("canvas-container")[0] as HTMLDivElement;
    let oImg: fabric.Image;
    if (imgRatio < winRatio) {
        const w = window.innerWidth * imageScaler;
        const h = (w * imgRatio) * imageScaler;
        const scaleX = w / imageOriginalWidth;
        const scaleY = h / imageOriginalHeight;
        oImg = img.set({
            left: 0,
            top: (window.innerHeight - h) / 10,
            scaleX: scaleX,
            scaleY: scaleY
        }) as fabric.Image;
        container.style.height = `${h}px`;
    } else {
        const w = (window.innerWidth * winRatio / imgRatio) * imageScaler;
        const h = window.innerHeight * imageScaler;
        const scaleX = w / imageOriginalWidth;
        const scaleY = h / imageOriginalHeight;
        oImg = img.set({
            left: (window.innerWidth - w) / 2,
            top: 0,
            scaleX: scaleX,
            scaleY: scaleY
        }) as fabric.Image;
        container.style.height = `${h}px`;
    }
    return oImg;
};
