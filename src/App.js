import "./Styles.scss";
import React, { useEffect, useRef, useState } from "react";
import 'tui-image-editor/dist/tui-image-editor.css'
import { Mic } from "./Mic";
import ConnectionContext, { ConnectionContextProvider } from "./ConnectionContext";
import ImageEditor from 'tui-image-editor';


const myTheme = {
    // Theme object to extends default dark theme.
    'common.bi.image': 'https://www.speechly.com/images/logo-speechly.png',
    'common.bisize.width': '251px',
    'common.bisize.height': '50px',
    'common.backgroundImage': 'none',
    'common.backgroundColor': '#4287f5',
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
  
const App = () => {
    const imageEditorRef = useRef()
    const [imageEditorInstance, setImageEditorInstance] = useState()
    const appId = process.env.REACT_APP_SPEECLY_APP_ID;
    if(!appId) {
        throw new Error('REACT_APP_SPEECLY_APP_ID environment variable is undefined!')
    }
    const language = "en-US";

    useEffect(() => {
        const editor = new ImageEditor(imageEditorRef.current, {
            includeUI: {
                loadImage: {
                    path: 'microphone_smaller.jpg',
                    name: 'Microphone'
                },
                theme: myTheme,
                menu: [],
                uiSize: {
                    height: '950px'
                },
                menuBarPosition: 'rights'
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
                    {({ stopContext, startContext, closeClient, clientState }) => {
                        return (
                            <div>
                                <Mic 
                                onUp={stopContext}
                                onDown={startContext}
                                onUnmount={closeClient}
                                clientState={clientState}
                                classNames="Playground__mic" />
                                
                                <i><b>Try out these:</b></i>
                                <ul>
                                    <li>I want it black and white (grayscale filter)</li>
                                    <li>no I don't like that</li>
                                    <li>why don't you add old image style (sepia filter)</li>
                                    <li>take off light</li>
                                    <li>add more luminosity</li>
                                    <li>what if we magnify a bit</li>
                                    <li>magnify to the bottom left corner</li>
                                </ul>
                            </div>
                        );
                    }}
                </ConnectionContext.Consumer>
            </ConnectionContextProvider>
        </div>
    );
};

export default App;