import {fabric} from 'fabric';
import { Canvas as FabricCanvas } from 'fabric/fabric-impl';

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
        //container.style.width = `${w}px`;                 
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
        //container.style.width = `${w}px`;
    }
    return oImg;
};

export class CanvasEditor {
    editorHTMLDiv: HTMLDivElement;
    imageUrl: string;
    canvas: FabricCanvas;
    htmlCanvas: HTMLCanvasElement;
    operationStack: any[];
    imageObject: fabric.Image;

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

        this.operationStack = []
    }

    resize = () => {
        const w = window.innerWidth
        const h = window.innerHeight
        this.htmlCanvas.width = w
        this.htmlCanvas.height = h
        this.htmlCanvas.style.width = `${w}px`
        this.htmlCanvas.style.height = `${h}px - 60px`
    }

    applyFilter(filterName: string, options?: Object) {
        const f = fabric.Image.filters;
        const name2filter = {
            'grayscale': f.Grayscale,
            'sepia': f.Sepia,
            'brightness': f.Brightness
        };
        if (filterName in name2filter) {
            // @ts-ignore
            let filter: fabric.IBaseFilter = (options) ? new name2filter[filterName](options) : new name2filter[filterName]();
            this.operationStack.push({type:"filter", operation: filter});
            const existingFilter = this.imageObject.filters?.filter((filter) => filterName in filter)
            if (existingFilter && existingFilter?.length > 0) {
                if(filterName === 'brightness' && options) {
                    // @ts-ignore
                    existingFilter[0].brightness = options?.brightness;
                }
            } else {
                this.imageObject.filters?.push(filter)
            }
            this.imageObject.applyFilters()
            this.canvas.renderAll()
        }
    }

    zoomIn() {
        this.operationStack.push({type: "zoom", operation: 0.2})
        const zooms = this.operationStack.filter(item => item.type === "zoom").map(item => item.operation);
        const zoomValue: number = 1 + zooms.reduce((a,b) => a+b)
        const centerY = window.innerHeight / 2;
        const centerX = window.innerWidth / 2;
        this.canvas.zoomToPoint(new fabric.Point(centerX,centerY), zoomValue);
    }
    
    undo() {
        if(this.operationStack.length > 0) {
            this.operationStack.pop();

            const outerScope = this;
            this.canvas.clear()
            fabric.Image.fromURL(this.imageUrl, function(img: fabric.Image) {
                if (img) {
                    outerScope.imageObject = img;
                    const oImg = resizeElements(img, outerScope.canvas);

                    let newZoomValue = 1;
                    if (outerScope.operationStack.length > 0) {
                        // RE-APPLY FILTERS
                        img.filters = outerScope.operationStack.filter(item => item.type === "filter").map(item => item.operation);
                        img.applyFilters();

                        // RE-APPLY ZOOM
                        const zooms = outerScope.operationStack.filter(item => item.type === "zoom").map(item => item.operation);
                        if (zooms.length > 0) {
                            newZoomValue += zooms.reduce((a,b) => a+b);
                        }
                    }
                    const centerY = window.innerHeight / 2;
                    const centerX = window.innerWidth / 2;
                    outerScope.canvas.zoomToPoint(new fabric.Point(centerX,centerY), newZoomValue);
                    outerScope.canvas.add(oImg);
                }
            });
        }
    }
}
