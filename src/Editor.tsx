import "./Styles.scss";
import React, {useLayoutEffect, useEffect, useRef, useState } from "react";
import {NavLinkProps} from "react-router-dom";
import {Location} from "history";
import 'tui-image-editor/dist/tui-image-editor.css';
import './layout.css';
import { Mic } from "./Mic";
import ConnectionContext, { ConnectionContextProvider } from "./ConnectionContext";
import ImageEditor from 'tui-image-editor';

function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

const myTheme = {
    // Theme object to extends default dark theme.
    'common.bi.image': 'https://www.speechly.com/images/logo-speechly.png',
    'common.bisize.width': '0px',
    'common.bisize.height': '0px',
    'common.backgroundImage': 'none',
    'common.backgroundColor': 'white',
    'common.border': '0px',

    'header.backgroundImage': 'none',
    'header.backgroundColor': 'transparent',
    'header.border': '0px',

    'menu.iconSize.width': '14px',
    'menu.iconSize.height': '14px',
    'menu.backgroundColor': 'white',
    'menu.normalIcon.color': 'white',
    'menu.activeIcon.color': 'white',
    'menu.disabledIcon.color': 'white',
    'menu.hoverIcon.color': 'white',
    // submenu primary color
    'submenu.backgroundColor': 'white',
    'submenu.partition.color': 'white',

    'range.value.color': '#fff',
    'range.value.fontWeight': 'lighter',
    'range.value.fontSize': '11px',
    'range.value.backgroundColor': 'white',
    'range.title.color': 'white',
    'range.title.fontWeight': 'lighter'
};

interface ExtendedLocation extends Location {
    imgPath: string;
};

type LocalStorageObject = {
    imgPath: string;
};

const LocalStorageKey = 'Speechly-image-editor-imagePath';
const Editor = (props: NavLinkProps) => {
    const imageEditorRef = useRef<HTMLDivElement>(null);
    const transcriptDivRef = useRef<HTMLDivElement>(null);
    const [imageEditorInstance, setImageEditorInstance] = useState<ImageEditor>()
    const [imagePath, setImagePath] = useState<string>();
    const appId = process.env.REACT_APP_APP_ID;
    if(!appId) {
        throw new Error('REACT_APP_APP_ID environment variable is undefined!')
    }
    const language = process.env.REACT_APP_LANGUAGE;
    if(!language) {
        throw new Error('REACT_APP_LANGUAGE environment variable is undefined!')
    }

    useEffect(() => {
        if(props.location) {
            const location = props.location as ExtendedLocation;
            let imgPath = location.imgPath;
            if(imgPath) {
                const storageObject: LocalStorageObject = { imgPath: imgPath };
                localStorage.setItem(LocalStorageKey, JSON.stringify(storageObject));
            } else {
                const json: string = localStorage.getItem(LocalStorageKey) as string;
                const storageObject: LocalStorageObject = JSON.parse(json) as LocalStorageObject;
                imgPath = storageObject.imgPath;
            }
            setImagePath(imgPath);
        }
    }, [props.location]);
    
    const [width, height] = useWindowSize();
    useEffect(() => {
        const editor = new ImageEditor(imageEditorRef.current as HTMLDivElement, {
            includeUI: {
                loadImage: {
                    path: imagePath as string,
                    name: "Image"
                },
                theme: myTheme,
                menu: [],
                menuBarPosition: 'top'
            },
            cssMaxHeight: Math.min(height - 50, 450),
            cssMaxWidth: width,
            selectionStyle: {
                cornerSize: 50,
                rotatingPointOffset: 100
            },
            usageStatistics: false
        });

        const canvases = imageEditorRef.current?.getElementsByTagName("canvas") as HTMLCollectionOf<HTMLCanvasElement>;
        const canvasCount = canvases?.length || 0;
        for (var i = 0; i < canvasCount; i++) {
            const canvas = canvases[i] as HTMLCanvasElement;
            canvas.onwheel = function(event){
                event.preventDefault();
            };
        }

        setImageEditorInstance(editor)
    }, [imageEditorRef, imagePath, width, height]);
    
    return (
        <div style={{width: width, height: Math.min(height, 500)}}>
                <div ref={imageEditorRef} />
                <section className="app">
                    <div ref={transcriptDivRef} />
                </section>

                <ConnectionContextProvider 
                    appId={appId} 
                    language={language} 
                    imageEditor={imageEditorInstance as ImageEditor}
                    transcriptDiv={transcriptDivRef.current as HTMLDivElement} >
                    <ConnectionContext.Consumer>
                        {({ stopContext, startContext, closeClient, clientState }) => {
                            return (
                                <div>
                                    <Mic 
                                    onUp={stopContext}
                                    onDown={startContext}
                                    onUnmount={closeClient}
                                    clientState={clientState}
                                    classNames="Playground__mic" />
                                    <section className="app">
                                        <i><b>Try out these:</b></i>
                                        <ul>
                                            <li>make it black and white</li>
                                            <li>increase the light</li>
                                            <li>decrease the light</li>
                                            <li>magnify one step</li>
                                            <li>magnify to the top left corner</li>
                                        </ul>
                                    </section>
                                </div>
                            );
                        }}
                    </ConnectionContext.Consumer>
                </ConnectionContextProvider>
        </div>
    );
};

export default Editor;