// @ts-nocheck
import React, { Component } from "react";
import {
  Client,
  ClientState,
  Segment,
  SegmentChangeCallback,
} from "@speechly/browser-client";
import {CanvasEditor} from './CanvasEditor';

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

        this.entity2canonical = {
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
    }

    browserClientStateChanged = (clientState: ClientState) => {
        this.setState({
            ...this.state,
            clientState });
    };

    updateStateBySegmentChange: SegmentChangeCallback = (segment: Segment) => {
        this.updateWords(segment.words, segment.contextId, segment.id);
        if (!segment.isFinal) {
            return
        }
        if (segment.intent.intent.length > 0) {
            const intent = segment.intent;
            if (intent.intent === "undo") {
                this.props.imageEditor.undo();
            } else if (intent.intent === "add_filter") {
                const filterName = this.collectEntity(segment.entities, "filter");
                if (filterName in this.entity2canonical) {
                    this.props.imageEditor.enableFilter(this.entity2canonical[filterName]);
                }
            } else if (intent.intent === "remove_filter") {
                const filterName = this.collectEntity(segment.entities, "filter");
                if (filterName in this.entity2canonical) {
                    this.props.imageEditor.disableFilter(this.entity2canonical[filterName]);
                }
            } else if (intent.intent === "increase") {
                const propertyName = this.collectEntity(segment.entities, "property");
                if (propertyName in this.entity2canonical) {
                    this.props.imageEditor.incrementProperty(this.entity2canonical[propertyName]);
                }
            } else if (intent.intent === "decrease") {
                const propertyName = this.collectEntity(segment.entities, "property");
                if (propertyName in this.entity2canonical) {
                    this.props.imageEditor.decrementProperty(this.entity2canonical[propertyName]);
                }
            }
        }
    };

    private collectEntity = (entityList, entityType: string) => {
        const entities = entityList.filter(item => item.type === entityType);
        if (entities.length > 0) {
            // In our case there should only be a single entity of a given type in a segment,
            // so we just return the first item on the list if it exsists.
            return entities[0].value.toLowerCase();
        }
        return '';
    }

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
