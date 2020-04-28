import "./ApiBrowser.scss";
import React, { useEffect, useRef, useState } from "react";
import 'tui-image-editor/dist/tui-image-editor.css'
import { Mic } from "./Mic";
import ConnectionContext, { ConnectionContextProvider } from "./ConnectionContext";
import { ClientState } from "@speechly/browser-client";
import ImageEditor from 'tui-image-editor';


const myTheme = {
    // Theme object to extends default dark theme.
};
  
const App = () => {
    const imageEditorRef = useRef()
    const [imageEditorInstance, setImageEditorInstance] = useState()
    //const appId = "4819d833-5c3c-460b-a17f-ba20af6b2f9a";
    const appId = "3c8f7acc-3641-466d-96ca-fb0d6f956cbe";
    //const appId = "bf522786-32cc-4aba-b073-b2d9c975967e";
    const language = "en-US";

    useEffect(() => {
        const editor = new ImageEditor(imageEditorRef.current, {
            includeUI: {
                loadImage: {
                    path: 'sampleImage.jpg',
                    name: 'SampleImage'
                },
                theme: myTheme,
                menu: ['shape', 'filter'],
                initMenu: 'filter',
                uiSize: {
                    height: '700px'
                },
                menuBarPosition: 'bottom'
            },
            cssMaxHeight: document.documentElement.clientWidth,
            cssMaxWidth: document.documentElement.clientHeight,
            selectionStyle: {
                cornerSize: 50,
                rotatingPointOffset: 100
            },
            usageStatistics: false
        });

        setImageEditorInstance(editor)
    }, [imageEditorRef]);

    return (
        <div>
            <div ref={imageEditorRef} />
            <ConnectionContextProvider appId={appId} language={language} imageEditor={imageEditorInstance} >
                <ConnectionContext.Consumer>
                    {({ stopSpeaking, startSpeaking, clientState }) => {
                        return (
                            <div className="Playground__mic">
                            <Mic onUp={stopSpeaking} onDown={startSpeaking} clientState={clientState} imageEditor={imageEditorInstance} />
                            <div
                                className={`Playground__mic__info ${
                                clientState === ClientState.Recording ? "Playground__mic__info--hidden" : ""
                                }`}
                            >
                                Press and hold space bar to talk
                            </div>
                            </div>
                        );
                    }}
                </ConnectionContext.Consumer>
            </ConnectionContextProvider>
        </div>
    );
};

export default App;