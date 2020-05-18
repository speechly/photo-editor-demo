import {fabric} from 'fabric';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric/fabric-impl';

type WinSize = {
    w: number;
    h: number;
};

type MapFilterIndexType = Record<string, number>;

export class CanvasEditor {
    editorHTMLDiv: HTMLDivElement;
    imageUrl: string;
    filterName2index: MapFilterIndexType;
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
        this.filterName2index = {
            'grayscale': 0
        };
        this.imageObject = new fabric.Image();
        const outerScope = this;
        fabric.Image.fromURL(imageUrl, function(img: fabric.Image) {
            if (img) {
                outerScope.imageObject = img;
                const imgRatio = (img.height || 1000) / (img.width || 1000)
                const winRatio = window.innerHeight / window.innerWidth    
                if (imgRatio > winRatio) {
                    const w = window.innerWidth;
                    const h = w * imgRatio;
                    var oImg = img.set({ left: 0, top: 0}).scaleToHeight(h).scaleToWidth(w);
                    canvas.add(oImg);
                    canvas.setHeight(h);
                    canvas.setWidth(w);
                }
                if (imgRatio < winRatio) {
                    //const h = window.innerHeight;
                    //const w = window.innerWidth * winRatio / imgRatio;
                    const w = window.innerWidth;
                    const h = w * imgRatio;
                    canvas.setHeight(h);
                    canvas.setWidth(w);
                    var oImg = img.set({ width:w,height:h})
                    canvas.add(oImg);
                }
            }
            outerScope.resize()
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
            'brightness': f.Brightness,
            'crop': f.Resize
        };
        if (filterName in name2filter) {
            // @ts-ignore
            let filter: fabric.IBaseFilter = (options) ? new name2filter[filterName](options) : new name2filter[filterName]();
            this.operationStack.push({type:"filter", operation: filter});
            this.imageObject.filters?.push(filter);
            this.imageObject.applyFilters();
            this.resize()
        }
    }

    zoomIn() {
        this.operationStack.push({type: "zoom", operation: 0.2})
        const zooms = this.operationStack.filter(item => item.type === "zoom").map(item => item.operation);
        const zoomValue: number = 1 + zooms.reduce((a,b) => a+b)
        this.canvas.setZoom(zoomValue)
        this.canvas.renderAll();
    }

    moveFocus(direction: string) {
        console.log(direction);
        let moveX = 0;
        let moveY = 0;
        const step = 200;
        switch (direction) {
            case 'left':
                moveX = step;
                break;
            case 'right':
                moveX = -step;
                break
            case 'up':
                moveY = step;
                break
            case 'down':
                moveY = -step;
                break
            default:
                break
        }
        this.operationStack.push({type: "move", operation: {moveX, moveY}})
        const point = new fabric.Point(moveX, moveY);
        this.canvas.relativePan(point);
    }
    
    undo() {
        if(this.operationStack.length > 0) {
            this.operationStack.pop();

            const outerScope = this;
            fabric.Image.fromURL(this.imageUrl, function(img: fabric.Image) {
                if (img) {
                    // CLEAR PREVIOUS VERSION
                    const context = outerScope.canvas.getContext();
                    context.clearRect(0, 0, outerScope.canvas.getWidth(), outerScope.canvas.getHeight());

                    outerScope.imageObject = img;
                    const imgRatio = (img.height || 1000) / (img.width || 1000)
                    const winRatio = window.innerHeight / window.innerWidth
                    var oImg;
                    if (imgRatio > winRatio) {
                        const w = window.innerWidth;
                        const h = w * imgRatio;
                        oImg = img.set({ left: 0, top: 0}).scaleToHeight(h).scaleToWidth(w);
                    } else {
                        const h = window.innerHeight;
                        const w = window.innerWidth * winRatio / imgRatio;
                        oImg = img.set({ left: 0, top: 0}).scaleToHeight(h).scaleToWidth(w);
                    }
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
                        
                        // RE-APPLY MOVE
                        const moves = outerScope.operationStack.filter(item => item.type === "move").map(item => item.operation);
                        if (moves.length > 0) {
                            const moveX: number = moves.reduce((a,b) => a.moveX+b.moveX)
                            const moveY: number = moves.reduce((a,b) => a.moveY+b.moveY)
                            const point = new fabric.Point(moveX, moveY);
                            outerScope.canvas.relativePan(point);
                        }
                    }
                    outerScope.canvas.setZoom(newZoomValue)
                    outerScope.canvas.add(oImg);
                }
            });
        }
    }
}
