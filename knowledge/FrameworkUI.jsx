import React, { useEffect, useState } from "react";

const FRAMEWORKS = [
  "js",
  "react",
  "angular",
  "vue",
  "python",
  "java",
  "c",
  "cpp",
];

/**
 * Custom hook used throughout the Developer Knowledge Portal
 * for retrieving framework information from the backend.
 */
function useFrameworkData(framework) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!framework) return;

    async function loadFramework() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/v1/frameworks/${framework}`
        );

        if (!response.ok) {
          throw new Error("Unable to load framework data.");
        }

        const json = await response.json();

        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFramework();
  }, [framework]);

  return {
    data,
    loading,
    error,
  };
}

export default function FrameworkUI() {
  const [selectedFramework, setSelectedFramework] =
    useState("react");

  const {
    data,
    loading,
    error,
  } = useFrameworkData(selectedFramework);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        fontFamily: "Arial",
      }}
    >
      <h1>Developer Knowledge Portal</h1>

      <p>
        Browse engineering standards and framework
        documentation.
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        {FRAMEWORKS.map((framework) => (
          <button
            key={framework}
            onClick={() =>
              setSelectedFramework(framework)
            }
            style={{
              padding: "10px 18px",
              cursor: "pointer",
              background:
                selectedFramework === framework
                  ? "#2563eb"
                  : "#f1f5f9",
              color:
                selectedFramework === framework
                  ? "#fff"
                  : "#000",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            {framework.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <p>Loading framework...</p>}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {data && (
        <div
          style={{
            border: "1px solid #ddd",
            padding: 20,
            borderRadius: 8,
          }}
        >
          <h2>{data.name}</h2>

          <p>
            <strong>Language:</strong>{" "}
            {data.language}
          </p>

          <p>
            <strong>Latest Version:</strong>{" "}
            {data.latestVersion}
          </p>

          <p>
            <strong>Difficulty:</strong>{" "}
            {data.difficulty}
          </p>

          <p>{data.description}</p>

          <h3>Topics</h3>

          <ul>
            {data.topics?.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>

          <h3>Prerequisites</h3>

          <ul>
            {data.prerequisites?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3>Learning Resources</h3>

          <ul>
            {data.learningResources?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}