import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { JsonViewer } from "@textea/json-viewer";
import { useDropzone } from "react-dropzone";
import "./JSONUploader.css";
import "./BouncingArrow.css";
import { useNavigate } from "react-router-dom";

function JSONUploader({ limitMB, usedMB, isDarkMode }) {
    const navigate = useNavigate();
    const [jsonFiles, setJsonFiles] = useState([]);
    const [fileDetails, setFileDetails] = useState([]);
    const [mergedJson, setMergedJson] = useState(null);
    const [override, setOverride] = useState(true);
    const [uploadedMB, setUploadedMB] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploadCompleted, setUploadCompleted] = useState(false);
    const mergeButtonRef = useRef(null);

    const calculateTotalUploadedMB = (details) =>
        details.reduce((sum, file) => sum + parseFloat(file.size), 0);

    const handleFileProcessing = async (files) => {
        const newFileDetails = [];
        const newJsonFiles = [];
        for (const file of files) {
            const text = await file.text();
            try {
                const parsed = JSON.parse(text);
                const sizeMB = new Blob([text]).size / (1024 * 1024);
                if (fileDetails.some((f) => f.name === file.name)) {
                    alert(`Skipping duplicate file: ${file.name}`);
                    continue;
                }
                newFileDetails.push({ name: file.name, size: sizeMB.toFixed(2), parsedJson: parsed });
                newJsonFiles.push(parsed);
            } catch (err) {
                alert(`❌ Invalid JSON in file: ${file.name}`);
                resetUploader();
                return;
            }
        }

        const combinedFileDetails = [...fileDetails, ...newFileDetails];
        const totalSize = calculateTotalUploadedMB(combinedFileDetails);
        const totalUsage = usedMB + totalSize;
        if (totalUsage > limitMB) {
            navigate("/upgrade", {
                state: { limitMB, usedMB, attemptedMB: totalSize.toFixed(2) },
            });
            return;
        }

        setFileDetails(combinedFileDetails);
        setJsonFiles(combinedFileDetails.map((f) => f.parsedJson));
        setUploadedMB(totalSize);
        setUploadCompleted(true);
        setMergedJson(null);
    };

    const resetUploader = () => {
        setJsonFiles([]);
        setFileDetails([]);
        setUploadedMB(0);
        setUploadCompleted(false);
        setMergedJson(null);
    };

    const handleDrop = (acceptedFiles) => handleFileProcessing(acceptedFiles);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        accept: { "application/json": [".json"] },
        multiple: true,
    });

    const handleRemoveFile = (fileName) => {
        const updated = fileDetails.filter((file) => file.name !== fileName);
        setFileDetails(updated);
        setJsonFiles(updated.map((f) => f.parsedJson));
        setUploadedMB(calculateTotalUploadedMB(updated));
        if (updated.length < 2) {
            setUploadCompleted(false);
        }
        setMergedJson(null);
    };

    const handleMerge = async () => {
        if (jsonFiles.length < 2) {
            alert("Please upload at least 2 JSON files to merge.");
            return;
        }

        setLoading(true);
        setMergedJson(null);
        try {
            const res = await axios.post("http://localhost:8000/merge-json", {
                jsons: jsonFiles,
                override,
            });
            setMergedJson(res.data.merged);
        } catch (err) {
            alert(`❌ Merge failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadAsJson = (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "merged_json_output.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const totalCurrentUsage = usedMB + uploadedMB;
    const totalUsagePercent = ((totalCurrentUsage / limitMB) * 100).toFixed(2);

    const scrollToMergeButton = () => mergeButtonRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (jsonFiles.length < 2) {
            setUploadCompleted(false);
        }
    }, [jsonFiles.length]);

    return (
        <div className={`json-uploader ${isDarkMode ? "dark" : "light"}`}>
            <section className="upload-section">
                <h2>Upload JSON Files</h2>
                <div {...getRootProps({ className: `dropzone ${isDragActive ? "active" : ""}` })}>
                    <input {...getInputProps()} />
                    <p>{isDragActive ? "Drop files..." : "Click or drag JSON files here"}</p>
                    <p>Minimum 2 files required to merge.</p>
                </div>
                {uploadCompleted && (
                    <div className="arrow-container" onClick={scrollToMergeButton}>
                        <div className="bouncing-arrow"></div>
                    </div>
                )}
            </section>

            <section className="usage-section">
                <h2>Usage</h2>
                <div className="usage-grid">
                    <div><strong>Limit:</strong> {limitMB} MB</div>
                    <div><strong>Used:</strong> {usedMB.toFixed(2)} MB</div>
                    <div><strong>Now:</strong> {uploadedMB.toFixed(2)} MB</div>
                    <div><strong>Total:</strong> {totalCurrentUsage.toFixed(2)} MB</div>
                </div>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${totalUsagePercent}%` }} />
                </div>
                <p>{totalUsagePercent}% used</p>
            </section>

            {fileDetails.length > 0 && (
                <section>
                    <h2>Files ({fileDetails.length})</h2>
                    {fileDetails.map((f) => (
                        <div key={f.name} className="file-item">
                            {f.name} - {f.size} MB
                            <button onClick={() => handleRemoveFile(f.name)}>&times;</button>
                        </div>
                    ))}
                </section>
            )}

            <section>
                <h2>Options</h2>
                <label>
                    <input type="checkbox" checked={override} onChange={() => setOverride(!override)} />
                    Override later keys
                </label>
            </section>

            <div className="action-area">
                <button
                    ref={mergeButtonRef}
                    onClick={handleMerge}
                    disabled={jsonFiles.length < 2 || totalCurrentUsage > limitMB || loading}
                    className="btn-primary"
                >
                    {loading ? "Merging..." : "🔀 Merge JSONs"}
                </button>

                {mergedJson && (
                    <button onClick={() => downloadAsJson(mergedJson)} className="btn-primary">
                        📥 Download JSON
                    </button>
                )}
            </div>

            {mergedJson && (
                <section>
                    <h2>Merged Output</h2>
                    <div className="json-viewer-container">
                        <JsonViewer
                            value={mergedJson}
                            theme={isDarkMode ? "dark" : "light"}
                            defaultInspectDepth={2}
                            rootName={false}
                            style={{
                                padding: "15px",
                                borderRadius: "8px",
                                backgroundColor: isDarkMode ? "#282c34" : "#f5f5f5",
                            }}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}

export default JSONUploader;
