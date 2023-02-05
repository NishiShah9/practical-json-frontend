import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { diffLines, formatLines } from "unidiff";
import { parseDiff, Diff, Hunk, getChangeKey } from "react-diff-view";
import { formatContentToJson } from "../utils";
import callApi from "../common/callApi";
import EditorContainer from "../component/EditorContainer";
import JsonAcceptModal from "../component/JsonAcceptModal";

const EMPTY_HUNKS = [];

function Home() {
  const [basedContent, setBasedContent] = useState(""); //based content
  const [patchContent, setPatchContent] = useState(""); // patch content
  const [diffContent, setDiffContent] = useState(""); // diff between 2 content
  const [{ type, hunks }, setDiff] = useState(""); // store difference
  const [patchId, setPatchId] = useState(""); // path id for update
  const [linesNo, setLinesNo] = useState({}); // current selected line no content
  const [loading, setLoading] = useState(false); // loader for loading
  const [showModal, setShowModal] = useState(false); // modal for accept or reject

  // update the difference between the content
  const updateDiffText = () => {
    if (basedContent !== "" && diffContent !== "") {
      const diffText = formatLines(diffLines(basedContent, diffContent), {
        context: 3,
      });
      const [diff] = parseDiff(diffText, { nearbySequences: "zip" });
      setDiff(diff);
    }
  };

  useEffect(() => {
    if (basedContent !== "" && diffContent !== "") {
      updateDiffText();
    }
  }, [diffContent, loading]);

  // generate the difference
  const handleGenerateDiff = async () => {
    setLoading(true);
    await callApi("/applyPatch", {
      method: "POST",
      data: {
        baseObj: JSON.parse(basedContent),
        patch: JSON.parse(patchContent),
      },
    })
      .then((res) => {
        let newJson = formatContentToJson(
          JSON.stringify(res?.data?.baseObject)
        );
        let subNew = formatContentToJson(
          JSON.stringify(res?.data?.convertObject)
        );
        setPatchId(res?.data?._id);
        setBasedContent(newJson);
        setDiffContent(subNew);

        updateDiffText();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (basedContent != "" && patchContent != "") {
      handleGenerateDiff();
    }
  }, [basedContent, patchContent]);

  // update the diff, handle Accept & reject after modal selected button
  const handleAccept = async (type) => {
    let keyCustomType = linesNo?.type == "I" ? "insert" : "delete";
    let updateData;
    let deleteData;
    if (linesNo?.data?.length == 1) {
      if (linesNo?.type == "I") {
        if (type == "accept") {
          updateData = linesNo?.data;
        } else {
          deleteData = linesNo?.data;
        }
      } else {
        if (type == "reject") {
          updateData = linesNo?.data;
        } else {
          deleteData = linesNo?.data;
        }
      }
    } else if (type == "accept") {
      updateData = linesNo?.data?.filter(
        (item) => item.hunkKey == keyCustomType
      );
    } else if (type == "reject") {
      updateData = linesNo?.data?.filter(
        (item) => item.hunkKey != keyCustomType
      );
    }

    let values =
      updateData?.length > 0
        ? updateData[0]?.data?.trim().split(":")
        : deleteData[0]?.data?.trim().split(":");

    let key = values[0]?.replace(/['"]+/g, "");
    let value = values[1]?.replace(/['"]+/g, "");

    let obj = {
      id: patchId,
    };
    if (updateData?.length > 0) {
      obj.updatedObj = {
        [key]: value,
      };
    }

    if (deleteData?.length > 0) {
      obj.deletedObj = {
        [key]: value,
      };
    }

    setLoading(true);
    await callApi("/updatePatch", {
      method: "POST",
      data: obj,
    })
      .then(async (res) => {
        if (res?.data) {
          setPatchId(res?.data?._id);
          setBasedContent(
            formatContentToJson(JSON.stringify(res?.data?.baseObject))
          );
          if (res?.data?.jsonPatch == []) {
            setPatchContent("");
          } else {
            setPatchContent(
              formatContentToJson(JSON.stringify(res?.data?.jsonPatch))
            );
          }
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
        setShowModal(false);
      });
  };

  const codeEvents = {
    // on row click for difference get the line no & data
    onClick({ change }) {
      const key = getChangeKey(change);
      let keyType = key.substring(0, 1);
      let keyId = parseInt(key.substring(1, key.length));
      let dataByLineNo = [];
      hunks?.map((item) => {
        item?.changes?.map((hunk) => {
          if (hunk.lineNumber == keyId) {
            dataByLineNo.push({
              lineNo: keyId,
              type: keyType,
              hunkKey: hunk?.type,
              data: hunk?.content,
            });
          }
        });
      });
      setLinesNo({ lineNo: keyId, type: keyType, data: dataByLineNo });
      setShowModal(true);
    },
  };

  return (
    <div>
      <div className="header-content">
        <EditorContainer
          value={basedContent}
          setValue={setBasedContent}
          headerTitle="Base Object"
          placeholder="Enter your Base Object here..."
        />
        <EditorContainer
          value={patchContent}
          setValue={setPatchContent}
          headerTitle="JSON Patch"
          placeholder="Enter your JSON Patch here..."
        />
      </div>

      <Diff viewType="unified" diffType={type} hunks={hunks || EMPTY_HUNKS}>
        {(hunks) =>
          hunks.map((hunk) => (
            <Hunk key={hunk.content} hunk={hunk} codeEvents={codeEvents} />
          ))
        }
      </Diff>

      <JsonAcceptModal
        open={showModal}
        setOpen={setShowModal}
        confirmLoading={loading}
        handleSubmit={() => handleAccept("accept")}
        handleReject={() => handleAccept("reject")}
      />
    </div>
  );
}

export default Home;
