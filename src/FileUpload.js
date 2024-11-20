import React, { useState } from "react";
import {
  CloseButton,
  Button,
  OverlayTrigger,
  Tooltip,
  Table,
  Form
} from "react-bootstrap";

const mainFunctions = require("./main-functions");

function msToTime(ms) {
  // Calculate hours, minutes, and seconds
  const hours = Math.floor(ms / 3600000); // 1 hour = 3600000 milliseconds
  ms %= 3600000;
  const minutes = Math.floor(ms / 60000); // 1 minute = 60000 milliseconds
  ms %= 60000;
  const seconds = Math.floor(ms / 1000); // 1 second = 1000 milliseconds

  // Format the result as "hh:mm:ss"
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return formattedTime;
}

export const FileUpload = ({
  onChange,
  maxFileSize,
  value,
  accept,
  maxFileCount = 50, 
  getFilesData, 
  resetAnimation,
  animationState, 
  setAnimationDisabled, 
  resetState, 
  setResetDisabled
}) => {
  const [list, setList] = useState(value || []);
  const [filesData, setFilesData] = useState(value || []);
  
  const rerender = () => {
    setList([...list]);
    if (list.length > 0){
      console.log("lengte s oke")
      setAnimationDisabled(false);
    }
    onChange && onChange(list);
  };

  const handleUp = (e, i) => {
    const temp = list[i];
    list[i] = list[i - 1];
    list[i - 1] = temp;
    //todo for filesData
    rerender();
  };

  const handleDown = (e, i) => {
    const temp = list[i];
    list[i] = list[i + 1];
    list[i + 1] = temp;
    //todo for filesData
    rerender();
  };

  const handleDelete = (e, i) => {
    list.splice(i, 1);
    filesData.splice(i, 1);
    rerender();
  };

  const handleOnChange = (e) => {
    let files = e.currentTarget.files;
    if (files) {
      let promises = [];
      for (let i = 0; i < files.length; i++) {
        let filePromise = new Promise(resolve => {
          let reader = new FileReader();
          reader.readAsText(files[i])    
          reader.onload = () => resolve([reader.result, files[i].name])
          //console.log(files[i])
        });
        promises.push(filePromise);
      }
      //filePromise.then(increaseProgressbar(100/files.length/2))
      Promise.all(promises).then(async fileContents => {
        let delta = 100/fileContents.length/2;
        for (let fileContent of fileContents) {
          const parseGpxData = await mainFunctions.parseGpxFileData(fileContent[0]);
          const trackInfo = await mainFunctions.getTracksPositions(parseGpxData);
          let fileData = {
            name: fileContent[1],
            positions: trackInfo.positions,
            times: trackInfo.times,
            type: parseGpxData[0].type,
            duration: (trackInfo.times[0][trackInfo.times[0].length - 1] - trackInfo.times[0][0])
          }
          //console.log(trackInfo)
          console.log("Filedata: ", fileData)
          filesData.push(fileData)
          
          //setShow(false)
        }
        list.push(...files)
        rerender();
        console.log(list)
      })
    }
  };

  const renderTooltip = (props) => (
    <Tooltip {...props}>File exceeds maximum allowable size</Tooltip>
  );

  const validate = (file) => {
    if (maxFileSize && maxFileSize > 0 && file.size > maxFileSize) {
      return (
        <OverlayTrigger placement="top" overlay={renderTooltip}>
          <span>{String.fromCharCode(9888)}</span>
        </OverlayTrigger>
      );
    }
  };

  const getTableBodyAsReactElement = () => {
    if (list) {
      return (
        <div className="tableContainer">
          <Table bordered striped hover size="sm" style={{fontSize: 11}} className="mt-3">
            <thead>
              <tr>
                <th width="15" scope="col">#</th>
                <th width="70" scope="col">Name</th>
                <th width="100" scope="col">Type</th>
                <th width="70" scope="col">Duration</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, i) => {
                return (
                  <tr key={i}>
                    <td key={i + ":#"}>{i + 1}</td>
                    <td>{item.name}</td>
                    <td>{filesData[i].type}</td>
                    <td>{msToTime(filesData[i].duration)}</td>
                    
                    <td>
                      {i > 0 ? (
                        <Button
                          key={i + ":up"}
                          variant="light"
                          onClick={(e) => handleUp(e, i)}
                        >
                          {String.fromCharCode(8593)}
                        </Button>
                      ) : null}
                      {i < list.length - 1 ? (
                        <Button
                          key={i + ":down"}
                          variant="light"
                          onClick={(e) => handleDown(e, i)}
                        >
                          {String.fromCharCode(8595)}
                        </Button>
                      ) : null}
                      <CloseButton
                        key={i + ":del"}
                        onClick={(e) => handleDelete(e, i)}
                      ></CloseButton>
                      {validate(item)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      );
    }
  };

  const renderFileInput = () => {
    if (!(maxFileCount > 0) || list.length < maxFileCount) {
      return (
        <Form.Control type="file" multiple onChange={handleOnChange} accept={accept} className="mb-3" />
      );
    }
  };

  const buttonClick = () => {
    getFilesData(filesData);
    setAnimationDisabled(true);
  }

  const resetButtonClick = () => {
    //getFilesData(filesData);
    resetAnimation();
    setAnimationDisabled(false);
  }

  return (
    <>
      {getTableBodyAsReactElement()}
      {renderFileInput()}

      <div>
        <Button disabled={animationState} onClick={buttonClick}>Play animation</Button>
        <Button className="ms-3" disabled={resetState} onClick={resetButtonClick}>Reset</Button>
      </div>
    </>
  );
};

export default FileUpload;
