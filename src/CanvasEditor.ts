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

  makeKodachromeFilter = () : fabric.IBaseFilter => {
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

  makeVintageFilter = () : fabric.IBaseFilter => {
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


  makeTechnicolorFilter = () : fabric.IBaseFilter => {
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


  makePolaroidFilter = () : fabric.IBaseFilter => {
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


  makeBaseFilter = (filterName: string, options?: Object) : fabric.IBaseFilter => {
    console.log('at makeBaseFilter with ' + filterName)
    if (filterName === 'grayscale') {
      return new fabric.Image.filters.Grayscale();
    }
    else if (filterName === 'sepia') {
      return new fabric.Image.filters.Sepia();
    }
    else if (filterName === 'brightness') {
      const brightnessParam = options as {brightness: number}
      return new fabric.Image.filters.Brightness(brightnessParam);
    }
    else if (filterName === 'contrast') {
      const contrastParam = options as {contrast: number}
      return new fabric.Image.filters.Contrast(contrastParam);
    }
    else if (filterName === 'saturation') {
      const saturationParam = options as {saturation: number}
      console.log('saturation param is ' + saturationParam.saturation)
      return new fabric.Image.filters.Saturation(saturationParam);
    }
    // we should never get here, though
    return new fabric.Image.filters.Grayscale();
  }

  applyFilter(filterName: string, options?: Object) {
        console.log('applyFilter called')
        const f = fabric.Image.filters;
        const name2filter = {
          'brightness': (opt: Object) => this.makeBaseFilter('brightness', opt),
          'contrast': (opt: Object) => this.makeBaseFilter('contrast', opt),
          'saturation': (opt: Object) => this.makeBaseFilter('saturation', opt),
          'kodachrome': this.makeKodachromeFilter,
          'grayscale': () => this.makeBaseFilter('grayscale'),
          'sepia': () => this.makeBaseFilter('sepia'),
          'vintage': this.makeVintageFilter,
          'technicolor': this.makeTechnicolorFilter,
          'polaroid': this.makePolaroidFilter
        };
      if (filterName in name2filter) {
            console.log('filter name is ' + filterName)
            // @ts-ignore
            let filter: fabric.IBaseFilter = (options) ? name2filter[filterName](options) : name2filter[filterName]();
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
