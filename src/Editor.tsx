import React, {useLayoutEffect, useEffect, useRef, useState } from "react";
import {NavLinkProps} from "react-router-dom";
import {Location} from "history";
import './layout.css';
import { Mic } from "./Mic";
import ConnectionContext, { ConnectionContextProvider } from "./ConnectionContext";
import {CanvasEditor} from './CanvasEditor';

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
    const [imageEditorInstance, setImageEditorInstance] = useState<CanvasEditor>();
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
        if (!imageEditorInstance && imagePath) {
            const editor = new CanvasEditor(imageEditorRef.current as HTMLDivElement, imagePath as string);
            setImageEditorInstance(editor);
        }
    }, [imageEditorRef, imagePath, width, height, imageEditorInstance]);
    
    return (
        <div style={{width: width, height: Math.min(height, 500)}}>
                <section className="photo">
                    <div ref={imageEditorRef} />
                </section>
                <section className="app">
                    <div ref={transcriptDivRef} />
                </section>

                <section className="controls">
                <ConnectionContextProvider 
                    appId={appId} 
                    language={language} 
                    imageEditor={imageEditorInstance as CanvasEditor}
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
                                            <li>add technicolor</li>
                                            <li>deactivate black and white</li>
                                            <li>add more light</li>
                                            <li>less light</li>
                                            <li>make it polaroid and reduce contrast</li>
                                            <li>increase saturation and make it classic</li>
                                        </ul>
                                    </section>
                                </div>
                            );
                        }}
                    </ConnectionContext.Consumer>
                </ConnectionContextProvider>
                </section>
        </div>
    );
};

export default Editor;