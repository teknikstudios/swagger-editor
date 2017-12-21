// Adapted from https://github.com/mlaursen/react-dd-menu/blob/master/src/js/DropdownMenu.js

/* eslint react/no-find-dom-node: 0 */

import React, { PureComponent, PropTypes } from "react"
import ReactDOM from "react-dom"
import CSSTransitionGroup from "react-transition-group/CSSTransitionGroup"
import classnames from "classnames"

const FILE_MODES = ["open","save","saveas"]

function Saving(props) {
  const isSaving = props.isSaving;
  if (isSaving) {
    return <h3 style={{paddingTop: "0px", paddingBottom: "0px"}}>Saving</h3>;
  }
  return null;
}

export default class SaveFileAs extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    filePath: PropTypes.func,
    fileName: PropTypes.func,
    fileContent: PropTypes.func,
    onSave: React.PropTypes.func,
    onCancel: React.PropTypes.func,
  };

  static defaultProps = {
    filePath: null,
    fileName: null,
    fileContent: null,
    onSave: function(filepath){},
    onCancel: function(){},
  };

  /*
   constructor
  */
  constructor(props, context) {
    super(props, context)

    this.state = {
      isSaving: false,
      saveAsComments: '',
    }
  }

  /*
   textResponse
  */
  textResponse(response) {
    if (!response.ok) {
      throw {code:response.status,reason:response.statusText}
    }
    return response.text()
  }

  /*
   jsonResponse
  */
  jsonResponse(response) {
    if (!response.ok) {
      throw {code:response.status,reason:response.statusText}
    }

    return response.json();
  }

  /*
   apiResponse
  */
  apiResponse(data) {
    if (data && data.success && data.success == true) {
      return data;
    }
    throw {code:500,reasonCode:((data && data.errorCode) ? data.errorCode : 0),reason:((data && data.errorMsg) ? data.errorMsg : 'Server error')}
  }


  /*
   handleError
  */
  handleError(error, message, callback) {
    console.log('Request failed', error);

    if (error && error.code && error.code == 403) {
      window.location.href = '/';
    } else if (message) {
      alert(message);
      callback.call(this);
    }
  }

  /*
   onFileSaved
  */
  onFileSaved() {
    var headers = {
      "Content-type": "text/plain; charset=UTF-8"
    }

    if (this.state.saveAsComments) {
      headers['x-comments'] = this.state.saveAsComments;
    }

    this.setState({ isSaving: true })

    fetch('http://127.0.0.1:3000/svn/' + this.props.filePath(), {
        method: 'put',
        credentials: 'include',
        headers: headers,
        body: this.props.fileContent()
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        this.props.onSave(this.props.fileContent(), this.props.fileName(), this.props.filePath())
        this.setState({ isSaving: false })
      })
      .catch(error => {
        alert('Error saving file. ' + error);
        this.setState({ isSaving: false })
      });
  }

  /*
   updateSaveAsCommentsValue
  */
  updateSaveAsCommentsValue(evt) {
    this.setState({
      saveAsComments: evt.target.value
    });
  }

  /*
   render
  */
  render() {
    const chooserClassName = "";//file-chooser"
    const listClassName = "file-chooser-items"//-" + (textAlign || align)

    return (
      <div className="container">

        <div className={chooserClassName} style={{margin: "1em"}}>
          <h1>Save file...</h1>
          <Saving isSaving={this.state.isSaving}></Saving>
          {this.state.isSaving == false ? (<textarea disabled={this.state.isSaving} placeholder="Comments" ref="commentsInput" onChange={this.updateSaveAsCommentsValue.bind(this)} rows="3" style={{display: "block", fontWeight: "normal", minHeight: "auto", fontSize: "1.3em", padding: "8px 12px", width: "100%", border: "solid 1px #797979", borderRadius: "0", margin: "20px 0 10px 0" }}>{this.state.saveAsCommnets}</textarea>) : null}
        </div>
        <div className="right" style={{paddingTop: "15px", marginTop: "10px",borderTop: "solid 1px #d4d4d4"}}>
          <button disabled={this.state.isSaving} className="btn cancel" onClick={this.props.onCancel}>Cancel</button>
          <button disabled={this.state.isSaving} className="btn" onClick={evt => { this.onFileSaved() }}>Save</button>
        </div>
      </div>
    )
  }
}
