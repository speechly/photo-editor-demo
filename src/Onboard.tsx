import "./layout.css";
import React, { useRef, useState } from "react";
import {Link} from "react-router-dom";
import logo from './img/logo.png';

type Images = {
    imgPath: string[]
}

const Onboard = () => {
    const [allowAudio, setAllowAudio] = useState<boolean>(false);
    const [images, setImages] = useState<Images>({imgPath: [process.env.PUBLIC_URL + '/images/microphone_smaller.jpg']});
    const imageInput = useRef<HTMLInputElement>(null);

    const addFile = () => {
        if (imageInput.current?.files) {
            const newImage = imageInput.current.files[0];
            setImages({
                imgPath: [...images.imgPath, URL.createObjectURL(newImage)]
            })
        }
    };
    
    const buttonClass = (allowAudio) ? 'btn' : 'btn btn-disabled'

    const lastImage: string = images.imgPath.slice(-1)[0];
    const editorLinkParams = { 
        pathname: "/edit/", 
        imgPath: lastImage
    };
    return (
        <div>
            <section className="app intro">

            <img className="logo" src={logo} alt=""></img>
            <section className="onboarding">
                <h1>Use speech to edit and apply filters for your  photos and images</h1>

                <section className="gallery">
                    {images.imgPath.map((path: string, index: number) => {
                        return (
                            <section className="thumbnail" key={index}>
                                <img src={path} alt=""></img>
                            </section>
                        )
                    })}
                    
                    <section className="upload upload-btn-wrapper">
                        <button className="upload-btn">Upload</button>
                        <input type="file" name="myfile" ref={imageInput} onChange={addFile}/>
                    </section>
                </section>

                <section className="formRow">
                    <input type="checkbox" name="micro" id="micro" value="" 
                        checked={allowAudio} 
                        onChange={(value) => setAllowAudio(value.target.checked)}></input>
                    <label htmlFor="micro">Allow Audio to control over voice</label>
                </section>

                <Link to={editorLinkParams} className={buttonClass}>Start editing</Link>
                </section>
            </section>
        </div>
    );
};

export default Onboard;