import React from "react"

export default class SaveFileAs extends React.Component {
  static propTypes = {
    className: React.PropTypes.string,
    onSave: React.PropTypes.func,
    onCancel: React.PropTypes.func,
  };

  static defaultProps = {
    className: null,
    onSave: function(){},
    onCancel: function(){},
  };

  /*
   constructor
  */
  constructor(props, context) {
    super(props, context)

    //let { root } = this.props

    this.state = {
      schemaSourceValue: localStorage.getItem('schema_source') || 'url',
      schemaUrlValue: localStorage.getItem('schema_url') || '',
      schemaTextValue: localStorage.getItem('schema_text') || '',
    }
  }

  /*
   onSchemaTextValueChanged
  */
  onSchemaTextValueChanged = (evt) => {
    localStorage.setItem('schema_text', evt.target.value)
    this.setState({
      schemaTextValue: evt.target.value
    });
  }

  /*
   onSchemaUrlValueChanged
  */
  onSchemaUrlValueChanged = (evt) => {
    localStorage.setItem('schema_url', evt.target.value)
    this.setState({
      schemaUrlValue: evt.target.value
    });
  }

  /*
   onSchemaSourceValueChanged
  */
  onSchemaSourceValueChanged = (evt) => {
    localStorage.setItem('schema_source', evt.target.value)
    this.setState({
      schemaSourceValue: evt.target.value
    });
  }

  /*
   componentDidMount
  */
  componentDidMount() {
    //this.loadDirectory();
  }

  /*
   componentWillUnmount
  */
  componentWillUnmount() {
    //this.serverRequest.abort();
  }

  /*
   render
  */
  render() {
    //const { size, className } = this.props
    //const { breadcrumb, newDirectoryFormVisible, creatingNewDirectory, currentDirectoryActionMenuOpen, editingCurrentDirectory, editedCurrentDirectoryName, currentDirectoryActionsWidth } = this.state

    return (
      <div className="container">

        <h3>JSON Validator Settings</h3>
        <p>
          <strong>Schema Source</strong>
        </p>
        <p style={{marginBottom:"20px"}}>
          <label style={{margin:"0px 15px 0 0"}}><input type="radio" name="schemasource" value="url" checked={this.state.schemaSourceValue == 'url'} onChange={this.onSchemaSourceValueChanged} /> URL</label>
          <label style={{margin:"0px 0px"}}><input type="radio" name="schemasource" value="text" checked={this.state.schemaSourceValue == 'text'} onChange={this.onSchemaSourceValueChanged} /> Text</label>
        </p>

        {this.state.schemaSourceValue == 'url' ? (<div><p><strong>Schema URL</strong></p><input type="text" value={this.state.schemaUrlValue} ref="schemaUrlValue" onChange={this.onSchemaUrlValueChanged} style={{width:'100%',border:'solid 1px #a4a4a4',fontFamily:'inherit',fontSize:'14px',color:'black',padding:'5px 10px',fontWeight:'normal'}} placeholder="JSON Schema URL" /></div>) : null}
        {this.state.schemaSourceValue == 'text' ? (<div><p><strong>Schema Text</strong></p><textarea value={this.state.schemaTextValue} ref="schemaTextValue" onChange={this.onSchemaTextValueChanged} style={{width:'100%',height:'300px',border:'solid 1px #a4a4a4',fontFamily:'inherit',fontSize:'14px',color:'black',padding:'15px',fontWeight:'normal'}} placeholder="JSON Schema" /></div>) : null}

        <div className="right" style={{paddingTop: "15px", marginTop: "10px",borderTop: "solid 1px #d4d4d4"}}>
          <button className="btn cancel" onClick={this.props.onCancel}>Cancel</button>
          <button className="btn" onClick={this.props.onSave}>Save</button>
        </div>
      </div>
    )
  }
}
