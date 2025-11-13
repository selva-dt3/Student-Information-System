import React from "react";

/**
 * PUBLIC_INTERFACE
 * SearchBar: Input for filtering list
 */
export default function SearchBar({ value, onChange, placeholder = "Search students..." }) {
  return (
    <div className="sis-searchbar" style={{ width: "min(380px, 100%)" }}>
      <input
        className="sis-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search students"
      />
    </div>
  );
}
