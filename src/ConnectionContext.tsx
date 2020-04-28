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
import ImageEditor from 'tui-image-editor';
import getEditDistance from "./levenhstein"

interface Entity extends BrowserClientEntity {
    contextId: string;
    segmentId: number;
}

interface Intent extends BrowserClientIntent {
  contextId: string;
  segmentId: number;
}
  

//Saving the raw items might be useful when using mock data
const saveRawItems = false;

type IConnectionContextProps = {
  appId: string;
  language: string;
  imageEditor: ImageEditor;
};
type IConnectionContextState = {
  isTapping: boolean;
  isClearConfirmOpen: boolean;
  isInitialLoadComplete: boolean;
  recordButtonIsPressed: boolean;
  recordButtonIsPressedStarted?: Date;
  recordButtonIsPressedStopped?: Date;
  intents: Intent[];
  entities: Entity[];
  stopSpeaking: (event: any) => void;
  startSpeaking: (event: any) => void;
  clearList: () => void;
  clearListConfirmed: () => void;
  client?: Client;
  clientState: ClientState;
};

const defaultState: IConnectionContextState = {
  stopSpeaking: (_event: Event) => {},
  startSpeaking: (_event: Event) => {},
  clearList: () => {},
  clearListConfirmed: () => {},
  intents: [],
  entities: [],
  recordButtonIsPressed: false,
  isTapping: false,
  isClearConfirmOpen: false,
  isInitialLoadComplete: false,
  clientState: ClientState.Disconnected,
};

const ConnectionContext = React.createContext<IConnectionContextState>(defaultState);
class ConnectionContextProvider extends Component<IConnectionContextProps, IConnectionContextState> {
  constructor(props: any) {
    super(props);
    this.state = defaultState;
  }
  componentDidMount() {
    const clientBasicParams = {
      appId: this.props.appId,
      language: this.props.language
    };
    const stagingParams = {
      url: "wss://staging.speechly.com/ws",
      debug: true
    };
    const clientInitParams = { ...clientBasicParams, ...stagingParams };
    console.log("Initializing client", clientInitParams);
    const client = new Client(clientInitParams);

    client.onSegmentChange(this.updateStateBySegmentChange);
    client.onStateChange(this.stateChanged);
    client.onEntity(this.onEntity);
    client.onIntent(this.onIntent)
    client.initialize((err?: Error) => {
      if (err) {
        console.error("Error initializing Speechly client:", err);
        return;
      }
    });
    this.setState({
      client 
    });
  }

  onEntity = (contextId: string, segmentId: number, browserClientEntity: BrowserClientEntity) => {
    if(browserClientEntity.isFinal) {
      const entity: Entity = {
        ...browserClientEntity,
        segmentId: segmentId + 1,
        contextId
      };
      this.setState({ entities: [...this.state.entities, entity] });
    }
  };

  onIntent = (contextId: string, segmentId: number, browserClientIntent: BrowserClientIntent) => {
    const intent: Intent = {
      ...browserClientIntent,
      segmentId: segmentId + 1,
      contextId
    };
    this.setState({ intents: [...this.state.intents, intent] });
  };

  updateStateBySegmentChange: SegmentChangeCallback = (segment: Segment) => {
    if (this.state.intents.length > 0) {
      const intent = this.state.intents[0];
      if (intent.intent === "undo") {
        // UNDO
        this.setState({
          ...defaultState,
          client: this.state.client
        })
        const something2undo = !this.props.imageEditor.isEmptyUndoStack();
        if (something2undo) {
          this.props.imageEditor.undo().then((response) => {
            console.log(response)
          }).catch((error) => console.error(error))
        }
      } else if (this.state.entities.length > 0) {
        const imageFilters = this.state.entities.filter(item => item.type === "filter")
        if (imageFilters.length > 0) {
          const imageFilter = imageFilters[0].value.toLowerCase(); // take only first one
          console.log("ImageFilter candidate: " + imageFilter)
          const filters = ["grayscale", "sepia", "blur","emboss", "invert", "sharpen"]
          
          if (filters.includes(imageFilter)) {
            this.setState({
              ...defaultState,
              client: this.state.client
            })

            this.applyFilter(imageFilter)
          } else if (imageFilter == "brightness") {
            this.setState({
              ...defaultState,
              client: this.state.client
            })
            
            var brightnessScale = 0.1;
            const scales = this.state.entities.filter(item => item.type === "scale")
            if (scales.length > 0) {
                const scale = parseInt(scales[0].value.toLowerCase(), 10);
                if (!scale) return;
                brightnessScale = scale / 100;
            }
            this.applyFilter(imageFilter, {brightness: brightnessScale})
          }
        }
      }
    }
  };
 
  applyFilter = (filter: string, options = {}) => {
    console.log("Add filter: " + filter)
    console.log(options)
    this.props.imageEditor.applyFilter(filter, options).then((response) => {
      console.log(response)
    }).catch((error) => console.error(error))
  }

  stateChanged = (clientState: ClientState) => {
    this.setState({ clientState });
  };

  startSpeaking = (event: any) => {
    const { client } = this.state;
    client?.startContext((err?: Error) => {
      if (err) {
        console.error("Could not start recording", err);
        return;
      }
    });
  };

  stopSpeaking = (event: any) => {
    this.toggleRecordButtonState(false);
    const { recordButtonIsPressedStarted, recordButtonIsPressedStopped } = this.state;

    this.stopRecording(event);
    if (recordButtonIsPressedStarted && recordButtonIsPressedStopped) {
      this.setState({
        isTapping: Boolean(recordButtonIsPressedStopped.getTime() - recordButtonIsPressedStarted.getTime() < 1000)
      });
    }
  };

  toggleRecordButtonState = (recordButtonIsPressed: boolean) => {
    this.setState({
      isTapping: false,
      recordButtonIsPressed,
      recordButtonIsPressedStarted: recordButtonIsPressed ? new Date() : this.state.recordButtonIsPressedStarted,
      recordButtonIsPressedStopped: !recordButtonIsPressed ? new Date() : this.state.recordButtonIsPressedStopped
    });
  };

  stopRecording = (event: any) => {
    this.state.client?.stopContext((err?: Error) => {
      if (err) {
        console.error("Could not stop recording", err);
        return;
      }
    });
  };

  clearList = () => {
    this.setState({ isClearConfirmOpen: true });
  };

  render() {
    return (
      <ConnectionContext.Provider
        value={{
          ...this.state,
          startSpeaking: this.startSpeaking,
          stopSpeaking: this.stopSpeaking
        }}
      >
        {this.props.children}
      </ConnectionContext.Provider>
    );
  }
}

export default ConnectionContext;
export { ConnectionContextProvider };
