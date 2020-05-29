// @ts-nocheck
import React, { Component } from "react";
import {
  Client,
  ClientState,
  Segment,
  SegmentChangeCallback,
} from "@speechly/browser-client";
import {CanvasEditor} from './CanvasEditor';
import updateImageEditorBySegmentChange from './speechlyTools';

type IConnectionContextProps = {
  appId: string;
  language: string;
  imageEditor: CanvasEditor;
  transcriptDiv: HTMLDivElement;
};

type IConnectionContextState = {
  stopContext: (event: any) => void;
  startContext: (event: any) => void;
  closeClient: () => void;
  clientState: ClientState;
  words: {};
  contextId: string;
};

const defaultState: IConnectionContextState = {
  stopContext: (_event: Event) => {},
  startContext: (_event: Event) => {},
  clientState: ClientState.Disconnected,
  words: {},
  contextId: ""
};

const ConnectionContext = React.createContext<IConnectionContextState>(defaultState);
class ConnectionContextProvider extends Component<IConnectionContextProps, IConnectionContextState> {
    constructor(props: any) {
        super(props);

        const clientBasicParams = {
            appId: this.props.appId,
            language: this.props.language
        };

        console.log("Initializing client", clientBasicParams);
        this.client = new Client(clientBasicParams);
        this.client.onSegmentChange(this.updateStateBySegmentChange);
        this.client.onStateChange(this.browserClientStateChanged);

        this.state = defaultState;
    }

    browserClientStateChanged = (clientState: ClientState) => {
        this.setState({...this.state, clientState });
    };

    updateStateBySegmentChange: SegmentChangeCallback = (segment: Segment) => {
        this.updateWords(segment.words, segment.contextId, segment.id);
        updateImageEditorBySegmentChange(segment, this.props.imageEditor);
    };

    updateWords = (words: Word[], contextId: string, segmentId: number) => {
      let newWords = {};
      if(this.state.contextId === contextId) {
          newWords = this.state.words;
      }

      for (var i = 0; i < words.length; i++) {
          if(words[i] && "index" in words[i]) {
              newWords[parseInt(words[i].index)] = words[i];
          }
      }

      this.setState({
          ...this.state,
          words: newWords,
          contextId });

      const transcriptDiv = this.props.transcriptDiv;
      if(newWords) {
          const html = Object.keys(newWords).map(key => parseInt(key)).sort()
                .map((key) => (newWords[key].isFinal ? `<b>${newWords[key].value}</b>` : newWords[key].value))
                .join(" "); 
          transcriptDiv.innerHTML = html;
      }
    };

    startContext = (event: any) => {
        if (this.state.clientState === ClientState.Disconnected) {
            this.client.initialize((err?: Error) => {
                if (err) {
                    console.error("Error initializing Speechly client:", err);
                    return;
                }
            });
            return;
        }

        if (this.state.clientState === ClientState.Connected) {
            this.client.startContext((err?: Error) => {
                if (err) {
                    console.error("Could not start recording", err);
                    return;
                }
            });
        }
    };

    stopContext = (event: any) => {
        if (this.state.clientState !== ClientState.Recording) {
            return;
        }

        this.client.stopContext((err?: Error) => {
            if (err) {
                console.error("Could not stop recording", err);
                return;
            }
        });
    };

    readonly closeClient = () => {
        if (this.state.clientState < ClientState.Connected) {
            return;
        }
        try {
            this.client.close((err?: Error) => {
                if (err !== undefined) {
                    console.error("Could not close client", err);
                }
            });
        } catch (err) {
            console.error("Could not close client", err);
        }
    };

    render() {
        return (
                <ConnectionContext.Provider
            value={{
                ...this.state,
                startContext: this.startContext,
                stopContext: this.stopContext,
                closeClient: this.closeClient
            }}
                >
                {this.props.children}
            </ConnectionContext.Provider>
        );
    }
}

export default ConnectionContext;
export { ConnectionContextProvider };
