import React, { useState } from "react";
import ReactJson from "react-json-view";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDropzone } from "react-dropzone";
import "./JSONFormatter.css";

function JSONFormatter({ isDarkMode }) {
    const [rawJson, setRawJson] = useState("");
    const [parsedJson, setParsedJson] = useState(null);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState("tree"); // "tree" | "text" | "table"

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(rawJson);
            setParsedJson(parsed);
            setError("");
        } catch (err) {
            setParsedJson(null);
            setError(`❌ Invalid JSON: ${err.message}`);
        }
    };

    const downloadAsExcel = () => {
        if (!Array.isArray(parsedJson)) {
            alert("Excel download only supported for array of objects.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(parsedJson);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveAs(blob, "formatted_json.xlsx");
    };

    const renderTable = (obj) => {
        if (!Array.isArray(obj)) return <p>Table view only works for array of objects.</p>;
        if (obj.length === 0) return <p>No rows to display.</p>;

        const headers = Object.keys(obj[0]);

        return (
            <table className="json-table">
                <thead>
                    <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {obj.map((row, idx) => (
                        <tr key={idx}>
                            {headers.map((h) => (
                                <td key={h}>{JSON.stringify(row[h])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const handleExcelUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            setParsedJson(json);
            setRawJson(JSON.stringify(json, null, 2));
            setViewMode("table");
            setError("");
        };
        reader.readAsArrayBuffer(file);
    };

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;
        if (file.name.endsWith(".json")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setRawJson(e.target.result);
                handleFormat();
            };
            reader.readAsText(file);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            handleExcelUpload(file);
        } else {
            alert("Unsupported file type. Only .json and .xlsx/.xls allowed.");
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/json": [".json"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"]
        },
        multiple: false,
    });

    return (
        <div className={`json-formatter ${isDarkMode ? "dark" : ""}`}>
            <h2>🧾 JSON Formatter</h2>

            <div {...getRootProps({ className: `dropzone ${isDragActive ? "active" : ""}` })}>
                <input {...getInputProps()} />
                <p className="dropzone-text">
                    {isDragActive
                        ? "Drop the file here..."
                        : "📂 Drag & drop a JSON or Excel file here, or click to upload"}
                </p>
            </div>

            <textarea
                rows="12"
                cols="80"
                placeholder="Paste your JSON here..."
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
            />

            <div className="toolbar">
                <button onClick={handleFormat}>Format</button>
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                    <option value="tree">🌳 Tree View</option>
                    <option value="table">📊 Table View</option>
                    <option value="text">📝 Raw Text</option>
                </select>
            </div>

            {error && <div className="error">{error}</div>}

            {parsedJson && (
                <div className="formatted-output">
                    {viewMode === "tree" && (
                        <ReactJson
                            src={parsedJson}
                            theme={isDarkMode ? "monokai" : "rjv-default"}
                            collapsed={2}
                            displayDataTypes={false}
                        />
                    )}
                    {viewMode === "text" && (
                        <pre className="raw-text">{JSON.stringify(parsedJson, null, 2)}</pre>
                    )}
                    {viewMode === "table" && renderTable(parsedJson)}

                    {viewMode === "table" && Array.isArray(parsedJson) && (
                        <button onClick={downloadAsExcel} style={{ marginTop: "10px" }}>
                            📥 Download Excel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default JSONFormatter;
