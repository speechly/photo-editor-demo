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
  brightness: number;
  stopContext: (event: any) => void;
  startContext: (event: any) => void;
  clearList: () => void;
  clearListConfirmed: () => void;
  clientState: ClientState;
};

const defaultState: IConnectionContextState = {
  stopContext: (_event: Event) => {},
  startContext: (_event: Event) => {},
  clearList: () => {},
  clearListConfirmed: () => {},
  intents: [],
  entities: [],
  brightness: 0.0,
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

    const clientBasicParams = {
      appId: this.props.appId,
      language: this.props.language
    };

    console.log("Initializing client", clientBasicParams);
    this.client = new Client(clientBasicParams);
    this.client.onSegmentChange(this.updateStateBySegmentChange);
    this.client.onStateChange(this.browserClientStateChanged);
    this.client.onEntity(this.onEntity);
    this.client.onIntent(this.onIntent);

    this.state = defaultState;
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

  browserClientStateChanged = (clientState: ClientState) => {
    this.setState({ clientState });
  };

  updateStateBySegmentChange: SegmentChangeCallback = (segment: Segment) => {
    if (!segment.isFinal) {
      return
    }
    if (this.state.intents.length > 0) {
      const intent = this.state.intents[0];
      if (intent.intent === "undo") {
        this.undoIntent()
      } else if (intent.intent === "add_grayscale_filter") {
        this.applyFilter("grayscale")
      } else if (intent.intent === "add_sepia_filter") {
        this.applyFilter("sepia")
      } else if (intent.intent === "increase_luminosity") {
        const scales = this.state.entities.filter(item => item.type === "scale")
        this.changeLuminosity(scales,  0.2)
      } else if (intent.intent === "decrease_luminosity") {
        const scales = this.state.entities.filter(item => item.type === "scale")
        this.changeLuminosity(scales, -0.2)
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
      ...defaultState,
      clientState: this.state.clientState,
      brightness: this.state.brightness
    })
  };
  changeLuminosity(scales, change) {
    if (scales.length > 0) {
      change = parseInt(scales[0].value.toLowerCase(), 10);
    }
    const newBrightness = this.state.brightness + change;
    this.setState({
      ...defaultState,
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

  stateChanged = (clientState: ClientState) => {
    this.setState({ clientState });
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

  clearList = () => {
    this.setState({ isClearConfirmOpen: true });
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
