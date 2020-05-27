// @ts-nocheck
import React, { Component } from "react";
import {
  Client,
  ClientState,
  Segment,
  SegmentChangeCallback,
  Entity as BrowserClientEntity,
  Intent as BrowserClientIntent
} from "@speechly/browser-client";
import {CanvasEditor} from './CanvasEditor';

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
  imageEditor: CanvasEditor;
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
  contrast: number;
  saturation: number;
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
  contrast: 0.0,
  saturation: 0,
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

    console.log("Initializing client", clientBasicParams);
    this.client = new Client(clientBasicParams);
    this.client.onSegmentChange(this.updateStateBySegmentChange);
    this.client.onStateChange(this.browserClientStateChanged);

    this.state = defaultState;

    this.change_fnc = {
      'luminosity': this.changeLuminosity,
      'brightness': this.changeLuminosity,
      'light': this.changeLuminosity,
      'contrast': this.changeContrast,
      'saturation': this.changeSaturation,
      'color': this.changeSaturation,
      '': () => {}
    };
    this.filterEntity2canonical = {
      "sepia": "sepia",
      "vintage": "vintage",
      "classic": "vintage",
      "faded": "sepia",
      "grayscale": "grayscale",
      "black and white": "grayscale",
      "kodachrome": "kodachrome",
      "technicolor": "technicolor",
      "polaroid": "polaroid"
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
        this.props.imageEditor.undo()
      } else if (intent.intent === "add_filter") {
        const filters = segment.entities.filter(item => item.type === "filter")
        if (filters.length > 0 && filters[0].value.toLowerCase() in this.filterEntity2canonical) {
          const filterName = this.filterEntity2canonical[filters[0].value.toLowerCase()]
          this.props.imageEditor.applyFilter(filterName);
        }
      } else if (intent.intent === "increase") {
        const properties = segment.entities.filter(item => item.type === "property")
        const prop = (properties[0]) ? properties[0].value.toLowerCase() : ''
        this.change_fnc[prop](1);
      } else if (intent.intent === "decrease") {
        const properties = segment.entities.filter(item => item.type === "property");
        const prop = (properties[0]) ? properties[0].value.toLowerCase() : '';
        this.change_fnc[prop](-1);
      } else if (intent.intent === "move") {
        const directions = segment.entities.filter(item => item.type === "direction");
        if (directions.length > 0) {
          const direction = directions[0].value.toLowerCase();
          this.props.imageEditor.moveFocus(direction);
        } 
      } else if (intent.intent === "crop") {
        this.props.imageEditor.zoomIn();
      }
    }
    this.setState({
      ...this.state,
      clientState: this.state.clientState,
      brightness: this.state.brightness,
      contrast: this.state.contrast,
      contextId: this.state.contextId
    })
  };

  private changeLuminosity = (changeSign) => {
    console.log('changeLuminosity, state is: ' + this.state)
    const newBrightness = this.state.brightness + changeSign * 0.2;
    this.setState({
      ...this.state,
      clientState: this.state.clientState,
      brightness: newBrightness
    })
    console.log("Brightness: " + newBrightness)
    this.props.imageEditor.applyFilter("brightness", {brightness: newBrightness});
  }

  private changeContrast = (changeSign) => {
    const newContrast = this.state.contrast + changeSign * 0.1;
    this.setState({
      ...this.state,
      clientState: this.state.clientState,
      contrast: newContrast
    })
    this.props.imageEditor.applyFilter("contrast", {contrast: newContrast});
  }

  private changeSaturation = (changeSign) => {
    const newSaturation = this.state.saturation + changeSign * 0.2;
    this.setState({
      ...this.state,
      clientState: this.state.clientState,
      saturation: newSaturation
    })
    this.props.imageEditor.applyFilter("saturation", {saturation: newSaturation});
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
