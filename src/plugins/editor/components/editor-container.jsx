import React, { PropTypes } from "react"
import debounce from "lodash/debounce"
import Modal from "boron/DropModal"
import YAML from "js-yaml"
import beautifyJson from "json-beautify"


const DEBOUNCE_TIME = 800 // 0.5 imperial seconds™

export default class EditorContainer extends React.Component {

  constructor(props, context) {
    super(props, context)
    this.onChange = debounce(this._onChange.bind(this), DEBOUNCE_TIME)

    this.state = {
      commentsValue: '',
      savingComments: false,
      hasValidator: false,
      isValidating: false,
      validatorSuccess: true,
      validatorErrorMessage: ""
    }
  }

  getValidator = () => {
    let text = localStorage.getItem('schema_text')
    let url = localStorage.getItem('schema_url')
    let source = localStorage.getItem('schema_source')

    if (!text || text.length == 0) { text = null }
    if (!url || url.length == 0) { url = null }
    if (!source || source.length == 0 || (source != 'url' && source != 'text')) { source = 'url' }

    return {
      hasValidator: ((source == 'text' && text) || (source == 'url' && url)) ? true : false,
      validatorSource: source,
      validatorText: text,
      validatorUrl: url,
    }
  }

  _onChange(value) {
    if(typeof this.props.onChange === "function") {
      this.props.onChange(value)
    }
    this.props.specActions.updateSpec(value)
  }

  /*
   showCommentsModal
  */
  showCommentsModal = (e) => {
    let { specSelectors } = this.props

    this.setState({savingComments: false, commentsValue: specSelectors.getComments()});

    e.preventDefault();
    this.refs.commentsModal.show()
  }

  /*
   hideCommentsModal
  */
  hideCommentsModal = () => {
    this.setState({savingComments: false});
    this.refs.commentsModal.hide()
  }

  /*
   onCommentsSaved
  */
  onCommentsSaved = () => {
    let { specActions, specSelectors } = this.props

    let fileName = this.props.specSelectors.getFileName();

    // Store the comments in localStorage
    specActions.setComments(this.state.commentsValue);

    if (fileName === null || fileName.length <= 0) {
      // This file hasn't been saved yet, so nothing else to do
      this.refs.commentsModal.hide()
    } else {
      this.setState({savingComments: true});

      // Save the updated comments to the file
      let editorContent = this.props.specSelectors.specStr()
      let filePath = this.props.specSelectors.getFilePath();
      let editorComments = this.state.commentsValue;
      let fileContent = JSON.stringify({
        type: 'swagger-file',
        version: '1.0.0',
        comments: editorComments,
        body: editorContent,
      });

      var headers = {
        "Content-type": "text/plain; charset=UTF-8"
      }

      fetch('http://localhost:3000/svn/' + filePath, {
          method: 'put',
          credentials: 'include',
          headers: headers,
          body: fileContent
        })
        .then(this.jsonResponse)
        .then(this.apiResponse)
        .then(data => {
          this.refs.commentsModal.hide()
        })
        .catch(error => {
          alert('Error saving comments.');
          this.setState({savingComments: false});
        });

    }
  }

  validateJson = () => {
    let { specActions, specSelectors } = this.props
    let { hasValidator, validatorSource, validatorText, validatorUrl } = this.getValidator();

    this.setState({hasValidator: hasValidator});
    this.refs.validatorModal.show()

    if (!hasValidator) {
      return;
    }

    this.setState({isValidating: true});

    let prettyJsonContent = '';

    try {
      let editorContent = this.props.specSelectors.specStr()
      let jsContent = YAML.safeLoad(editorContent)
      prettyJsonContent = beautifyJson(jsContent, null, 2)
    } catch (err) {
      this.setState({isValidating: false, validatorSuccess: false, validatorErrorMessage: "Your document is not a valid JSON format. " + err});
      return;
    }

    let validator = (validatorSource == 'text' ? '&schemaText='+encodeURIComponent(validatorText) : '&schemaUrl='+encodeURIComponent(validatorUrl))
    let validatorEndpoint = (validatorSource == 'text' ? 'validatefromtext' : 'validatefromurl');

    //let yamlContent = YAML.safeDump(jsContent)

    fetch('http://localhost:3000/validator/' + validatorEndpoint, {
        method: 'post',
        credentials: 'include',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        body: 'json='+encodeURIComponent(prettyJsonContent)+validator
      })
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        if (!data || !data.success || data.success !== true) {
          let message = 'Server error';
          if (data && data.errors) {
            message = "" + data.errors;
            if (Array.isArray(data.errors)) {
              message = (<ul>{data.errors.map((err, idx) => {
                return <li key={idx}>
                  <strong>{err.keyword}</strong>: {err.message}<br />
                  {Object.keys(err.params).map((param, paramIdx) => (<div key={paramIdx}>{param}: {err.params[param]}</div>))}
                  Data Path: {err.dataPath}<br />
                  Schema Path: {err.schemaPath}<br />
                </li>
              })}</ul>)
              //message = data.errors.message;
              //keyword, dataPath, schemaPath, params
            }
          }

          throw message;
        }

        this.setState({isValidating: false, validatorSuccess: true});
      })
      .catch(error => {
        this.setState({isValidating: false, validatorSuccess: false, validatorErrorMessage: error});
      });
  }



  /*
   onCommentsValueChanged
  */
  onCommentsValueChanged = (evt) => {
    this.setState({
      commentsValue: evt.target.value
    });
  }

  /*
   render
  */
  render() {
    let { specSelectors, getComponent, errSelectors, fn, readOnly, editorSelectors, specActions } = this.props
    let { hasValidator } = this.getValidator();

    let Editor = getComponent("Editor")

    let wrapperClasses = ["editor-wrapper"]

    if(readOnly) {
      wrapperClasses.push("read-only")
    }

    let propsForEditor = this.props
    let comments = specSelectors.getComments();
    let fileName = specSelectors.getFileName();
    let filePath = 'http://localhost:3000/swagger/viewer/' + specSelectors.getFilePath();
    let isNewDocument = false;
    if (fileName === null || !fileName || fileName == '') {
      fileName = 'Untitled';
      isNewDocument = true;
    }

    return (
      <div id='editor-wrapper' className={wrapperClasses.join(" ")}>
        <div className="filename-wrapper">
          <h2>{fileName}{ specSelectors.doesHaveUnsavedChanges() ? <span>*</span> : '' } { readOnly ? <span>Read Only</span> : null }</h2>
          <h3><a onClick={this.showCommentsModal} className="comments" href="#">Comments</a> <a onClick={this.validateJson} className="validator" href="#">Validate</a> { fileName != 'Untitled' ? <a className="swaggerui" href={filePath} target="_blank">Open in Swagger UI</a> : null}</h3>
        </div>
        <Editor
          {...propsForEditor}
          value={specSelectors.specStr()}
          specObject={specSelectors.specJson().toJS()}
          errors={errSelectors.allErrors()}
          onChange={this.onChange}
          goToLine={editorSelectors.gotoLine()}
          AST={fn.AST}
        />
        <Modal className="swagger-ui modal" closeOnClick={true} ref="validatorModal">
          <h2>JSON Schema Validator</h2>
          {this.state.hasValidator ? (this.state.isValidating ? (<h3>Validating...</h3>) : (
                      this.state.validatorSuccess ?
                        (<h3 style={{color:"#008800"}}>PASS</h3>) :
                        (<div style={{padding:'0 0 20px 0'}}><h3 style={{color:"#FF0000"}}>FAIL</h3><div style={{maxHeight:"300px",overflowY:"auto"}}>{this.state.validatorErrorMessage}</div></div>)
                      )
                    ) : <div><h3 style={{color:"#FF0000"}}>A JSON schema has not been specified.</h3><p>Go to Settings - JSON Validator to specify your JSON schema</p></div>}
        </Modal>
        <Modal className="swagger-ui modal" closeOnClick={false} ref="commentsModal">
          <textarea value={this.state.commentsValue} ref="commentsInput" onChange={this.onCommentsValueChanged} style={{width:'100%',height:'300px',border:'solid 1px #a4a4a4',fontFamily:'inherit',fontSize:'16px',color:'black',padding:'15px',fontWeight:'normal'}} placeholder="Comments" />
          <div className="right" style={{paddingTop: "15px", marginTop: "10px",borderTop: "solid 1px #d4d4d4"}}>
            <button disabled={this.state.savingComments} className="btn cancel" onClick={this.hideCommentsModal}>Cancel</button>
            <button disabled={this.state.savingComments} className={"btn " + (this.state.savingComments ? "loading" : "")} style={{width:"100px"}} onClick={this.onCommentsSaved}>Save</button>
          </div>
        </Modal>
      </div>
    )
  }

}

EditorContainer.defaultProps = {
  onChange: Function.prototype
}

EditorContainer.propTypes = {
  specActions: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  fn: PropTypes.object,
  specSelectors: PropTypes.object.isRequired,
  errSelectors: PropTypes.object.isRequired,
  editorSelectors: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  readOnly: PropTypes.bool
}
