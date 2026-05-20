"""
Visualization and metrics plotting for CV Model Accuracy
Generates curves and plots for model performance analysis
"""

import json
import matplotlib.pyplot as plt
import matplotlib
import numpy as np
from typing import Dict, List, Tuple
import os
from datetime import datetime

# Use non-interactive backend for server environments
matplotlib.use('Agg')

class ModelMetricsVisualizer:
    """Generate visualizations for model performance metrics"""
    
    def __init__(self, output_dir="./plots"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def plot_entity_metrics(self, entity_metrics: Dict[str, Dict[str, float]], 
                           filename="entity_metrics.png"):
        """
        Plot precision, recall, and F1-score for each entity type
        
        Args:
            entity_metrics: Dict with structure {entity_label: {metric: value}}
        """
        if not entity_metrics:
            print("No entity metrics to plot")
            return
        
        # Filter entities that actually have precision, recall, and f1 metrics
        valid_entities = [e for e in entity_metrics if isinstance(entity_metrics[e], dict) and 'precision' in entity_metrics[e] and 'recall' in entity_metrics[e] and 'f1' in entity_metrics[e]]
        
        if not valid_entities:
            print("No valid entity metrics (precision, recall, f1) found to plot")
            return
        
        precisions = [entity_metrics[e]['precision'] for e in valid_entities]
        recalls = [entity_metrics[e]['recall'] for e in valid_entities]
        f1_scores = [entity_metrics[e]['f1'] for e in valid_entities]
        
        x = np.arange(len(valid_entities))
        width = 0.25
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        bars1 = ax.bar(x - width, precisions, width, label='Precision', color='#2E86AB')
        bars2 = ax.bar(x, recalls, width, label='Recall', color='#A23B72')
        bars3 = ax.bar(x + width, f1_scores, width, label='F1-Score', color='#F18F01')
        
        ax.set_ylabel('Score', fontsize=12, fontweight='bold')
        ax.set_title('Entity Recognition Metrics by Type', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(valid_entities, rotation=45, ha='right')
        ax.legend(fontsize=10)
        ax.set_ylim([0, 1.1])
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        
        # Add value labels on bars
        self._add_value_labels(ax, bars1)
        self._add_value_labels(ax, bars2)
        self._add_value_labels(ax, bars3)
        
        plt.tight_layout()
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        print(f"Saved: {filepath}")
        plt.close()
    
    def plot_extraction_accuracy(self, accuracies: List[float], 
                                filename="extraction_accuracy.png"):
        """
        Plot extraction accuracy for each sample
        
        Args:
            accuracies: List of accuracy scores
        """
        if not accuracies:
            print("No accuracy data to plot")
            return
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Plot individual accuracies
        samples = range(1, len(accuracies) + 1)
        colors = ['#2E86AB' if acc >= 0.7 else '#A23B72' if acc >= 0.5 else '#C1121F' 
                 for acc in accuracies]
        
        ax.bar(samples, accuracies, color=colors, alpha=0.7, edgecolor='black')
        
        # Add average line
        avg_accuracy = np.mean(accuracies)
        ax.axhline(y=avg_accuracy, color='red', linestyle='--', linewidth=2, 
                  label=f'Average: {avg_accuracy:.2%}')
        
        # Add threshold lines
        ax.axhline(y=0.7, color='green', linestyle=':', linewidth=1, alpha=0.5, label='Good (70%)')
        ax.axhline(y=0.5, color='orange', linestyle=':', linewidth=1, alpha=0.5, label='Fair (50%)')
        
        ax.set_xlabel('Sample Number', fontsize=12, fontweight='bold')
        ax.set_ylabel('Accuracy', fontsize=12, fontweight='bold')
        ax.set_title('Extraction Accuracy Per Sample', fontsize=14, fontweight='bold')
        ax.set_ylim([0, 1.1])
        ax.legend(fontsize=10)
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        
        plt.tight_layout()
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        print(f"Saved: {filepath}")
        plt.close()
    
    def plot_confusion_matrix(self, y_true: List[str], y_pred: List[str], 
                             filename="confusion_matrix.png"):
        """
        Plot confusion matrix for predictions
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
        """
        try:
            from sklearn.metrics import confusion_matrix as cm
            import seaborn as sns
        except ImportError:
            print("scikit-learn and seaborn required for confusion matrix plot")
            return
        
        if not y_true or not y_pred:
            print("No data for confusion matrix")
            return
        
        # Get unique labels
        labels = sorted(list(set(y_true + y_pred)))
        
        # Compute confusion matrix
        conf_matrix = cm(y_true, y_pred, labels=labels)
        
        fig, ax = plt.subplots(figsize=(10, 8))
        sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=labels, yticklabels=labels, ax=ax, cbar_kws={'label': 'Count'})
        
        ax.set_xlabel('Predicted', fontsize=12, fontweight='bold')
        ax.set_ylabel('True', fontsize=12, fontweight='bold')
        ax.set_title('Confusion Matrix', fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        print(f"Saved: {filepath}")
        plt.close()
    
    def plot_precision_recall_curve(self, precision: List[float], recall: List[float],
                                   filename="precision_recall_curve.png"):
        """
        Plot precision-recall curve
        
        Args:
            precision: List of precision values
            recall: List of recall values
        """
        if not precision or not recall:
            print("No data for precision-recall curve")
            return
        
        fig, ax = plt.subplots(figsize=(10, 7))
        
        ax.plot(recall, precision, marker='o', linewidth=2, markersize=8, 
               color='#2E86AB', label='PR Curve')
        
        ax.set_xlabel('Recall', fontsize=12, fontweight='bold')
        ax.set_ylabel('Precision', fontsize=12, fontweight='bold')
        ax.set_title('Precision-Recall Curve', fontsize=14, fontweight='bold')
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1.05])
        ax.grid(True, alpha=0.3)
        ax.legend(fontsize=10)
        
        plt.tight_layout()
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        print(f"Saved: {filepath}")
        plt.close()
    
    def plot_roc_curve(self, fpr: List[float], tpr: List[float], auc: float = None,
                      filename="roc_curve.png"):
        """
        Plot ROC curve
        
        Args:
            fpr: False positive rates
            tpr: True positive rates
            auc: Area under curve value
        """
        if not fpr or not tpr:
            print("No data for ROC curve")
            return
        
        fig, ax = plt.subplots(figsize=(10, 7))
        
        ax.plot(fpr, tpr, marker='o', linewidth=2, markersize=6, 
               color='#2E86AB', label=f'ROC Curve' + (f' (AUC={auc:.3f})' if auc else ''))
        ax.plot([0, 1], [0, 1], 'k--', linewidth=1, label='Random')
        
        ax.set_xlabel('False Positive Rate', fontsize=12, fontweight='bold')
        ax.set_ylabel('True Positive Rate', fontsize=12, fontweight='bold')
        ax.set_title('ROC Curve', fontsize=14, fontweight='bold')
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1])
        ax.grid(True, alpha=0.3)
        ax.legend(fontsize=10)
        
        plt.tight_layout()
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        print(f"Saved: {filepath}")
        plt.close()
    
    def plot_performance_summary(self, results: Dict, filename="performance_summary.png"):
        """
        Create a comprehensive performance summary dashboard
        
        Args:
            results: Dictionary with test results
        """
        fig = plt.figure(figsize=(15, 10))
        gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)
        
        # 1. Overall Accuracy
        ax1 = fig.add_subplot(gs[0, 0])
        avg_acc = results.get('avg_extraction_accuracy', 0)
        colors_acc = ['#2E86AB' if avg_acc >= 0.7 else '#A23B72' if avg_acc >= 0.5 else '#C1121F']
        ax1.bar(['Average Accuracy'], [avg_acc], color=colors_acc, edgecolor='black', linewidth=2)
        ax1.set_ylim([0, 1])
        ax1.set_ylabel('Score', fontweight='bold')
        ax1.set_title('Overall Extraction Accuracy', fontweight='bold')
        ax1.text(0, avg_acc + 0.05, f'{avg_acc:.2%}', ha='center', fontweight='bold', fontsize=12)
        ax1.grid(axis='y', alpha=0.3)
        
        # 2. Samples Tested
        ax2 = fig.add_subplot(gs[0, 1])
        samples = results.get('samples_tested', 0)
        ax2.text(0.5, 0.5, str(samples), ha='center', va='center', 
                fontsize=48, fontweight='bold', transform=ax2.transAxes)
        ax2.text(0.5, 0.1, 'Samples Tested', ha='center', va='center', 
                fontsize=14, transform=ax2.transAxes)
        ax2.axis('off')
        
        # 3. Entity Metrics
        ax3 = fig.add_subplot(gs[1, :])
        entity_metrics = results.get('entity_metrics', {})
        valid_entities = [e for e in entity_metrics if isinstance(entity_metrics[e], dict) and 'precision' in entity_metrics[e] and 'f1' in entity_metrics[e]]
        if valid_entities:
            x = np.arange(len(valid_entities))
            width = 0.35
            
            precisions = [entity_metrics[e]['precision'] for e in valid_entities]
            f1_scores = [entity_metrics[e]['f1'] for e in valid_entities]
            
            ax3.bar(x - width/2, precisions, width, label='Precision', color='#2E86AB', alpha=0.8)
            ax3.bar(x + width/2, f1_scores, width, label='F1-Score', color='#F18F01', alpha=0.8)
            
            ax3.set_ylabel('Score', fontweight='bold')
            ax3.set_title('Entity Recognition Performance', fontweight='bold')
            ax3.set_xticks(x)
            ax3.set_xticklabels(valid_entities)
            ax3.set_ylim([0, 1.1])
            ax3.legend()
            ax3.grid(axis='y', alpha=0.3)
        else:
            ax3.text(0.5, 0.5, "No entity metrics (precision, f1) available", 
                     ha='center', va='center', fontsize=12, transform=ax3.transAxes)
            ax3.set_title('Entity Recognition Performance', fontweight='bold')
            ax3.set_ylim([0, 1.1])
            ax3.grid(axis='y', alpha=0.3)
        
        # 4. Accuracy Distribution
        ax4 = fig.add_subplot(gs[2, 0])
        accuracies = results.get('extraction_accuracies', [])
        if accuracies:
            ax4.hist(accuracies, bins=10, color='#2E86AB', edgecolor='black', alpha=0.7)
            ax4.axvline(np.mean(accuracies), color='red', linestyle='--', 
                       linewidth=2, label=f'Mean: {np.mean(accuracies):.2%}')
            ax4.set_xlabel('Accuracy', fontweight='bold')
            ax4.set_ylabel('Frequency', fontweight='bold')
            ax4.set_title('Accuracy Distribution', fontweight='bold')
            ax4.legend()
            ax4.grid(axis='y', alpha=0.3)
        
        # 5. Test Information
        ax5 = fig.add_subplot(gs[2, 1])
        ax5.axis('off')
        info_text = f"""
        Test Report
        ─────────────────
        Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Status: {'✓ PASSED' if avg_acc >= 0.7 else '⚠ NEEDS IMPROVEMENT'}
        
        Performance: {'Excellent' if avg_acc >= 0.9 else 'Good' if avg_acc >= 0.7 else 'Fair' if avg_acc >= 0.5 else 'Poor'}
        """
        ax5.text(0.1, 0.9, info_text, transform=ax5.transAxes, fontsize=10,
                verticalalignment='top', family='monospace',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.suptitle('Model Performance Summary Dashboard', 
                    fontsize=16, fontweight='bold', y=0.995)
        
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        print(f"Saved: {filepath}")
        plt.close()
    
    def create_all_plots_from_results(self, results_file: str = "test_results.json"):
        """
        Load results from JSON and create all available plots
        
        Args:
            results_file: Path to test_results.json
        """
        if not os.path.exists(results_file):
            print(f"Results file not found: {results_file}")
            return
        
        with open(results_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
        
        print(f"\n=== Generating Visualizations ===\n")
        
        # Generate entity metrics plot
        if results.get('entity_metrics'):
            self.plot_entity_metrics(results['entity_metrics'])
        
        # Generate extraction accuracy plot
        if results.get('extraction_accuracies'):
            self.plot_extraction_accuracy(results['extraction_accuracies'])
        
        # Generate performance summary dashboard
        self.plot_performance_summary(results)
        
        print(f"\n[OK] All plots saved to: {self.output_dir}\n")
    
    @staticmethod
    def _add_value_labels(ax, bars):
        """Add value labels on top of bars"""
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:.2f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 3),
                       textcoords="offset points",
                       ha='center', va='bottom',
                       fontsize=9, fontweight='bold')


def generate_test_report_html(results_file: str = "test_results.json", 
                            output_file: str = "test_report.html"):
    """
    Generate an HTML report from test results
    
    Args:
        results_file: Path to test results JSON
        output_file: Path to output HTML file
    """
    if not os.path.exists(results_file):
        print(f"Results file not found: {results_file}")
        return
    
    with open(results_file, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    entity_metrics_html = ""
    if results.get('entity_metrics'):
        rows = ""
        for entity, metrics in results['entity_metrics'].items():
            if isinstance(metrics, dict) and 'precision' in metrics and 'recall' in metrics and 'f1' in metrics:
                rows += f"""
                <tr>
                    <td>{entity}</td>
                    <td>{metrics['precision']:.3f}</td>
                    <td>{metrics['recall']:.3f}</td>
                    <td>{metrics['f1']:.3f}</td>
                </tr>
                """
        if rows:
            entity_metrics_html = "<table border='1' style='border-collapse: collapse; width: 100%;'>"
            entity_metrics_html += "<tr><th>Entity Type</th><th>Precision</th><th>Recall</th><th>F1-Score</th></tr>"
            entity_metrics_html += rows
            entity_metrics_html += "</table>"
        else:
            entity_metrics_html = "<p>No detailed entity metrics available.</p>"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>CV Model Test Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
            .container {{ background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #2E86AB; border-bottom: 3px solid #2E86AB; padding-bottom: 10px; }}
            h2 {{ color: #333; margin-top: 30px; }}
            .metric {{ margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #2E86AB; }}
            table {{ margin: 20px 0; border-collapse: collapse; width: 100%; }}
            th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #2E86AB; color: white; }}
            .status {{ font-weight: bold; font-size: 1.2em; }}
            .pass {{ color: #4CAF50; }}
            .warning {{ color: #ff9800; }}
            .fail {{ color: #f44336; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>CV Model Test Report</h1>
            
            <div class="metric">
                <strong>Report Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </div>
            
            <h2>Summary</h2>
            <div class="metric">
                <strong>Samples Tested:</strong> {results.get('samples_tested', 0)}
            </div>
            <div class="metric">
                <strong>Average Accuracy:</strong> {results.get('avg_extraction_accuracy', 0):.2%}
                <span class="status {'pass' if results.get('avg_extraction_accuracy', 0) >= 0.7 else 'warning' if results.get('avg_extraction_accuracy', 0) >= 0.5 else 'fail'}">
                    ({'✓ PASSED' if results.get('avg_extraction_accuracy', 0) >= 0.7 else '⚠ NEEDS IMPROVEMENT'})
                </span>
            </div>
            
            <h2>Entity Recognition Metrics</h2>
            {entity_metrics_html}
            
            <h2>Recommendations</h2>
            <ul>
                <li>Review low-scoring entities for potential improvements</li>
                <li>Consider augmenting training data for underperforming categories</li>
                <li>Analyze false positives and false negatives to understand patterns</li>
            </ul>
        </div>
    </body>
    </html>
    """
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Saved HTML report to: {output_file}")


if __name__ == "__main__":
    # Create visualizer
    visualizer = ModelMetricsVisualizer()
    
    # Generate plots from results file
    visualizer.create_all_plots_from_results("test_results.json")
    
    # Generate HTML report
    generate_test_report_html("test_results.json", "test_report.html")
    
    print("\n[SUCCESS] All visualizations generated successfully!")
