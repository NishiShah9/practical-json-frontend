import React from "react";
import { Input } from "antd";
import { formatContentToJson } from "../utils";
import JsonIcon from "../component/JsonIcon";

function EditorContainer({ headerTitle, value, setValue, placeholder }) {
  return (
    <div className="header-inside-content">
      <div className="header-title-div">
        <h3 className="header-text">{headerTitle}</h3>
        <JsonIcon />
      </div>
      <div className="editor-content">
        <Input.TextArea
          className="editor-text-content"
          rows={20}
          onBlur={() => {
            const formatted = formatContentToJson(value);
            setValue(formatted);
          }}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export default EditorContainer;
