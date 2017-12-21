import React, { PropTypes } from "react"
import debounce from "lodash/debounce"
import Modal from "boron/DropModal"
import YAML from "js-yaml"
import beautifyJson from "json-beautify"
import DropdownMenu from "../../../standalone/topbar/DropdownMenu"


const DEBOUNCE_TIME = 800 // 0.5 imperial seconds™

export default class EditorContainer extends React.Component {

  constructor(props, context) {
    super(props, context)
    this.onChange = debounce(this._onChange.bind(this), DEBOUNCE_TIME)

    this.state = {
      hasValidator: false,
      isValidating: false,
      validatorSuccess: true,
      jsonSchemasLoading: false,
      jsonSchemasError: null,
      jsonSchemas: [],
      validatorErrorMessage: ""
    }
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
   textResponse
  */
  textResponse(response) {
    if (!response.ok) {
      throw {code:response.status,reason:response.statusText}
    }
    return response.text()
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

  validateJson = (filename) => {
    let { specActions, specSelectors } = this.props


    this.setState({hasValidator: true, isValidating: true});
    this.refs.validatorModal.show()

    fetch('http://127.0.0.1:3000/svn/jsonschemas/' + filename, {credentials: 'include'})
      .then(this.textResponse)
      .then(data => {

        let prettyJsonContent = '';

        try {
          let editorContent = this.props.specSelectors.specStr()
          let jsContent = YAML.safeLoad(editorContent)
          prettyJsonContent = beautifyJson(jsContent, null, 2)
        } catch (err) {
          this.setState({isValidating: false, validatorSuccess: false, validatorErrorMessage: "Your document is not a valid JSON format. " + err});
          return;
        }

        fetch('http://127.0.0.1:3000/validator/validatefromtext', {
            method: 'post',
            credentials: 'include',
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            body: 'json='+encodeURIComponent(prettyJsonContent)+'&schemaText='+encodeURIComponent(data)
          })
          .then(resp => {
            return resp.json();
          })
          .then(data => {
            console.log(data);
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
                }
              }

              throw message;
            }

            this.setState({isValidating: false, validatorSuccess: true});
          })
          .catch(error => {
            this.setState({isValidating: false, validatorSuccess: false, validatorErrorMessage: error});
          });

      })
      .catch(error => {
        this.setState({isValidating: false, validatorSuccess: false, validatorErrorMessage: "Error loading json schema. " + error});
      });

  }



  showValidators = (stateKey) => {

    this.setState( { jsonSchemasLoading: true });

    fetch('http://127.0.0.1:3000/svn/jsonschemas/', {
        method: 'get',
        credentials: 'include'
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(posts => {
        let directories = [];
        let files = [];

        for (var i=0; i<posts.directories.length; i++) {
          directories.push( { name: posts.directories[i] } );
        }
        for (var i=0; i<posts.files.length; i++) {
          files.push( { name: posts.files[i].name } );
        }

        this.setState( { jsonSchemasLoading: false, jsonSchemas: files });
      })
      .catch(error => {
        this.setState( { jsonSchemasLoading: false, jsonSchemasError: 'Unable to load schemas. ' + error });
      });

    this.setState({ [stateKey]: !this.state[stateKey] })
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
    let fileName = specSelectors.getFileName();
    let filePath = 'http://127.0.0.1:3000/swagger/viewer/' + specSelectors.getFilePath();
    let isNewDocument = false;
    if (fileName === null || !fileName || fileName == '') {
      fileName = 'Untitled';
      isNewDocument = true;
    }

    let makeMenuOptions = (name) => {
      let stateKey = `is${name}MenuOpen`
      let toggleFn = () => { this.showValidators(stateKey) }
      return {
        isOpen: !!this.state[stateKey],
        close: () => this.setState({ [stateKey]: false }),
        align: "left",
        toggle: <span className="menu-item" onClick={toggleFn}>{ name }</span>
      }
    }

    return (
      <div id='editor-wrapper' className={wrapperClasses.join(" ")}>
        <div className="filename-wrapper">
          <h2>{fileName}{ specSelectors.doesHaveUnsavedChanges() ? <span>*</span> : '' } { readOnly ? <span>Read Only</span> : null }</h2>
          <h3>
            <DropdownMenu {...makeMenuOptions("Validate")}>
              {this.state.jsonSchemasLoading ?
                (<li><button type="button" disabled="disabled">Loading Schemas, please wait...</button></li>)
                :
                this.state.jsonSchemas.map((schema, idx) => {
                  return <li key={idx}><button type="button" onClick={() => {this.validateJson(schema.name)}}>{schema.name}</button></li>
                })
              }
            </DropdownMenu>
            { fileName != 'Untitled' ? <a className="swaggerui" href={filePath} target="_blank">Open in Swagger UI</a> : null}</h3>
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
