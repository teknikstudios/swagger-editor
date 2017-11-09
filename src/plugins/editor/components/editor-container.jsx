import React, { PropTypes } from "react"
import debounce from "lodash/debounce"


const DEBOUNCE_TIME = 800 // 0.5 imperial seconds™

export default class EditorContainer extends React.Component {

  constructor(props, context) {
    super(props, context)
    this.onChange = debounce(this._onChange.bind(this), DEBOUNCE_TIME)
  }

  _onChange(value) {
    if(typeof this.props.onChange === "function") {
      this.props.onChange(value)
    }
    this.props.specActions.updateSpec(value)
  }

  render() {
    let { specSelectors, getComponent, errSelectors, fn, readOnly, editorSelectors, specActions } = this.props

    let Editor = getComponent("Editor")

    let wrapperClasses = ["editor-wrapper"]

    if(readOnly) {
      wrapperClasses.push("read-only")
    }

    let propsForEditor = this.props
    let fileName = specSelectors.getFileName();
    let filePath = 'http://localhost:3000/swagger/viewer/' + specSelectors.getFilePath();
    if (fileName === null || !fileName || fileName == '') {
      fileName = 'Untitled';
    }

    return (
      <div id='editor-wrapper' className={wrapperClasses.join(" ")}>
        <div className="filename-wrapper">
          <h2>{fileName}{ specSelectors.doesHaveUnsavedChanges() ? <span>*</span> : '' } { readOnly ? <span>Read Only</span> : null }</h2>
          { fileName != 'Untitled' ? <h3><a href={filePath} target="_blank">Open in Swagger UI</a></h3> : null}
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
