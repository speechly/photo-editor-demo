// @ts-nocheck
import React, { Component } from "react";
import {
  Client,
  ClientState,
  Segment,
  SegmentChangeCallback,
  TranscriptCallback,
  Entity as BrowserClientEntity,
  Intent as BrowserClientIntent
} from "@speechly/browser-client";
import ImageEditor from 'tui-image-editor';

interface Entity extends BrowserClientEntity {
    contextId: string;
    segmentId: number;
}

interface Intent extends BrowserClientIntent {
  contextId: string;
  segmentId: number;
}
  
type IConnectionContextProps = {
  appId: string;
  language: string;
  imageEditor: ImageEditor;
  transcriptDiv: HTMLDivElement;
};
type IConnectionContextState = {
  isTapping: boolean;
  recordButtonIsPressed: boolean;
  recordButtonIsPressedStarted?: Date;
  recordButtonIsPressedStopped?: Date;
  intents: Intent[];
  entities: Entity[];
  brightness: number;
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
  intents: [],
  entities: [],
  brightness: 0.0,
  recordButtonIsPressed: false,
  isTapping: false,
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

    // REMOVE THIS ONCE PRODUCTION RELEASE
    clientBasicParams.url = "wss://staging.speechly.com/ws";
    clientBasicParams.debug = true;
    // REMOVE THIS ONCE PRODUCTION RELEASE

    console.log("Initializing client", clientBasicParams);
    this.client = new Client(clientBasicParams);
    this.client.onSegmentChange(this.updateStateBySegmentChange);
    this.client.onStateChange(this.browserClientStateChanged);
    //this.client.onTranscript(this.updateStateByTranscriptChange);

    this.state = defaultState;
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
    const valueEntity2canonical = {
      "light": "brightness",
      "luminosity": "brightness",
      "brightness": "brightness"
    }
    if (segment.intent.intent.length > 0) {
      const intent = segment.intent;
      if (intent.intent === "undo") {
        this.undoIntent()
      } else if (intent.intent === "add_filter") {
        const filters = segment.entities.filter(item => item.type === "filter")
        const filterEntity2canonical = {
          "old image": "sepia",
          "classic": "sepia",
          "black and white": "grayscale"
        }
        if (filters.length > 0 && filters[0].value.toLowerCase() in filterEntity2canonical) {
          this.applyFilter(filterEntity2canonical[filters[0].value.toLowerCase()])
        }
      } else if (intent.intent === "increase") {
        const values = segment.entities.filter(item => item.type === "value")
        if (values.length > 0 && values[0].value.toLowerCase() in valueEntity2canonical) {
          const value = valueEntity2canonical[values[0].value.toLowerCase()];
          if(value === "brightness") {
            this.changeLuminosity([],  0.2)
          }
        }
      } else if (intent.intent === "decrease") {
        const values = this.state.entities.filter(item => item.type === "value")
        if (values.length > 0 && values[0].value.toLowerCase() in valueEntity2canonical) {
          const value = valueEntity2canonical[values[0].value.toLowerCase()];
          if(value === "brightness") {
            this.changeLuminosity([],  -0.2)
          }
        }
      } else if (intent.intent === "crop") {
        const directions = this.state.entities.filter(item => item.type === "direction")

        const canvasSize = this.props.imageEditor.getCanvasSize();
        const width = canvasSize.width;
        const height = canvasSize.height;

        if (directions.length === 0) {
          this.cropTo(
            Math.round(width * 0.1), 
            Math.round(height * 0.1), 
            Math.round(width * 0.8), 
            Math.round(height * 0.8))
        } else {
          const direction = directions[0].value.toLowerCase()
          switch (direction) {
            case 'top left':
              this.cropTo(
                0, 
                0, 
                Math.round(width * 0.5), 
                Math.round(height * 0.5))
              break;
            case 'top right':
              this.cropTo(
                width - Math.round(width * 0.5), 
                0, 
                Math.round(width * 0.5), 
                Math.round(height * 0.5))
              break
            case 'bottom left':
              this.cropTo(
                0, 
                height - Math.round(width * 0.5), 
                Math.round(width * 0.5), 
                Math.round(height * 0.5))
              break
            default:
              this.cropTo(
                Math.round(width * 0.1), 
                Math.round(height * 0.1), 
                Math.round(width * 0.8), 
                Math.round(height * 0.8))
          }
        }
      }
    }
    this.setState({
      ...this.state,
      clientState: this.state.clientState,
      brightness: this.state.brightness,
      contextId: this.state.contextId
    })
  };

  updateStateByTranscriptChange: TranscriptCallback = (contextId: string, segmentId: number, word: Word) => {
    let newWords = {};
    if(this.state.contextId === contextId) {
      newWords = this.state.words;
    } else if (this.state.contextId !== "") {
      //debugger
    }
    const index = word.index;
    newWords[index] = word;
    this.setState({ 
      ...this.state,
      words: newWords, 
      contextId });
  }

  changeLuminosity(scales, change) {
    if (scales.length > 0) {
      change = parseInt(scales[0].value.toLowerCase(), 10);
    }
    const newBrightness = this.state.brightness + change;
    this.setState({
      ...this.state,
      clientState: this.state.clientState,
      brightness: newBrightness
    })
    this.applyFilter("brightness", {brightness: newBrightness})
  }

  undoIntent() {
    const something2undo = !this.props.imageEditor.isEmptyUndoStack();
    if (something2undo) {
      this.props.imageEditor.undo().then((response) => {
        console.log(response)
        if (response.options) {
          this.setState({
            ...this.state,
            brightness: this.state.brightness - (response.options.brightness || 0)
          })
        }
      }).catch((error) => console.error(error))
    }
  }

  cropTo(left: number, top: number, width: number, height: number) {
    this.props.imageEditor.crop(
      {left: left, top: top, width: width, height: height}
    ).then((response) => console.log(response)).catch((error) => console.error(error))
  }
 
  applyFilter = (filter: string, options = {}) => {
    console.log("Add filter: " + filter)
    console.log(options)
    this.props.imageEditor.applyFilter(filter, options).then((response) => {
      console.log(response)
    }).catch((error) => console.error(error))
  }

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
    this.toggleRecordButtonState(false);
    const { recordButtonIsPressedStarted, recordButtonIsPressedStopped } = this.state;

    this.stopRecording(event);
    if (recordButtonIsPressedStarted && recordButtonIsPressedStopped) {
      this.setState({
        ...this.state,
        isTapping: Boolean(recordButtonIsPressedStopped.getTime() - recordButtonIsPressedStarted.getTime() < 1000)
      });
    }
  };

  toggleRecordButtonState = (recordButtonIsPressed: boolean) => {
    this.setState({
      ...this.state,
      isTapping: false,
      recordButtonIsPressed,
      recordButtonIsPressedStarted: recordButtonIsPressed ? new Date() : this.state.recordButtonIsPressedStarted,
      recordButtonIsPressedStopped: !recordButtonIsPressed ? new Date() : this.state.recordButtonIsPressedStopped
    });
  };

  stopRecording = (event: any) => {
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

  updateWords = (words: Word[], contextId: string, segmentId: number) => {
    let newWords = {};
    if(this.state.contextId === contextId) {
      newWords = this.state.words;
    }
    /*if(!segmentId in newWords || typeof newWords[segmentId] !== 'object'){
      newWords[segmentId] = {}
    }*/
  
    for (var i = 0; i < words.length; i++) {
      if(words[i] && words[i].index) {
        //newWords[segmentId][words[i].index] = words[i];
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
