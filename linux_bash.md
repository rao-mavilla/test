import os
from collections import defaultdict
from pathlib import Path
from fnmatch import fnmatch
from html import escape

# === CONFIGURATION ===
MAX_DEPTH = 2  # Controls heading depth only
EXTENSIONS = ["*.pdf", "*.html", "*.cmd", "*.par", "*.txt"]
OUTPUT_FILE = "report.html"

# === FUNCTIONS ===

def get_ancestor_key(base_path, current_path, max_depth):
    """Returns the path up to the max_depth level for grouping."""
    relative_parts = Path(os.path.relpath(current_path, base_path)).parts
    limited_parts = relative_parts[:max_depth] if len(relative_parts) >= max_depth else relative_parts
    return "." if not limited_parts else "/".join(limited_parts)

def get_filtered_summary(root_folder):
    summary = defaultdict(lambda: defaultdict(int))  # {group_key: {extension: count}}

    for current_path, dirs, files in os.walk(root_folder):
        group_key = get_ancestor_key(root_folder, current_path, MAX_DEPTH)
        for file in files:
            for pattern in EXTENSIONS:
                if fnmatch(file, pattern):
                    summary[group_key][pattern] += 1
                    break

    return summary

def compare_summaries(summary1, summary2):
    all_keys = set(summary1.keys()).union(summary2.keys())
    comparison = {}

    for key in sorted(all_keys):
        types = set(summary1[key].keys()).union(summary2[key].keys())
        comparison[key] = {
            ext: (summary1[key].get(ext, 0), summary2[key].get(ext, 0))
            for ext in types
        }

    return comparison

def generate_html_report(comparison, folder1_name, folder2_name, output_file=OUTPUT_FILE):
    html = [
        "<html><head><title>Folder Comparison Report</title>",
        "<style>body{font-family:sans-serif}h3{margin-top:1.5em}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}</style>",
        "</head><body><h2>Folder Comparison Report</h2>",
        f"<p>Comparing: <b>{escape(folder1_name)}</b> vs <b>{escape(folder2_name)}</b></p>"
    ]

    for folder_key, types in comparison.items():
        html.append(f"<h3>{escape(folder_key)}</h3>")
        html.append("<table><tr><th>Extension</th><th>{}</th><th>{}</th><th>Difference</th></tr>".format(
            escape(folder1_name), escape(folder2_name)))

        for ext, (count1, count2) in sorted(types.items()):
            diff = count2 - count1
            html.append(
                f"<tr><td>{escape(ext)}</td><td>{count1}</td><td>{count2}</td><td>{diff:+}</td></tr>"
            )

        html.append("</table>")

    html.append("</body></html>")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(html))

    print(f"Report generated: {output_file}")

# === MAIN EXECUTION ===

if __name__ == "__main__":
    folder1 = "path/to/folder1"
    folder2 = "path/to/folder2"

    summary1 = get_filtered_summary(folder1)
    summary2 = get_filtered_summary(folder2)

    comparison = compare_summaries(summary1, summary2)
    generate_html_report(comparison, Path(folder1).name, Path(folder2).name)
