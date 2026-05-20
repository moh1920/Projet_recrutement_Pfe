# Testing and Metrics Evaluation Guide

This guide explains how to use the new testing and visualization scripts for the CV extraction model.

## Files Created

### 1. `test_accuracy.py` - Model Accuracy Testing
Comprehensive testing script that evaluates the CV extraction model's performance.

**Features:**
- Tests extraction accuracy on multiple CV samples
- Calculates NER (Named Entity Recognition) metrics
- Computes precision, recall, and F1-score for each entity type
- Generates detailed JSON report with all metrics
- Tests identification, formation, and competence extraction

**Usage:**
```bash
python test_accuracy.py
```

**Output:**
- `test_results.json` - Detailed test results and metrics
- Console output with summary statistics

**Example Output:**
```
=== Testing on 2 CV samples ===

Sample 1/2...
Sample 2/2...

✓ Average Extraction Accuracy: 92.50%

Entity Recognition Metrics:
  - Precision: 0.856
  - Recall: 0.798
  - F1-Score: 0.826
```

### 2. `plot_metrics.py` - Visualization and Metrics Plotting
Generates professional visualizations and reports from test results.

**Features:**
- Bar charts for entity recognition metrics (Precision, Recall, F1-Score)
- Sample-by-sample accuracy distribution
- Performance summary dashboard
- Confusion matrices (requires scikit-learn)
- Precision-recall curves
- ROC curves
- HTML test report generation

**Usage:**
```bash
# Generate visualizations from existing test_results.json
python plot_metrics.py
```

**Outputs Generated:**
- `plots/entity_metrics.png` - Entity-wise performance metrics
- `plots/extraction_accuracy.png` - Per-sample accuracy
- `plots/performance_summary.png` - Comprehensive dashboard
- `plots/confusion_matrix.png` - Confusion matrix (if applicable)
- `plots/precision_recall_curve.png` - PR curve
- `plots/roc_curve.png` - ROC curve
- `test_report.html` - Interactive HTML report

## Complete Workflow

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Train the Model (if not already trained)
```bash
python train_model.py
```

### Step 3: Run Accuracy Tests
```bash
python test_accuracy.py
```

This will create `test_results.json` with all metrics.

### Step 4: Generate Visualizations
```bash
python plot_metrics.py
```

This will create a `plots/` directory with all visualization files.

### Step 5: View Results
- **Charts**: Open PNG files in `plots/` directory
- **HTML Report**: Open `test_report.html` in a web browser
- **JSON Data**: Inspect `test_results.json` for raw data

## Metrics Explained

### Precision
- **Definition**: Of all entities the model identified, how many were correct?
- **Formula**: True Positives / (True Positives + False Positives)
- **Range**: 0 to 1 (higher is better)
- **Meaning**: Measures how precise the model is when making predictions

### Recall
- **Definition**: Of all actual entities, how many did the model find?
- **Formula**: True Positives / (True Positives + False Negatives)
- **Range**: 0 to 1 (higher is better)
- **Meaning**: Measures the model's ability to find all relevant instances

### F1-Score
- **Definition**: Harmonic mean of Precision and Recall
- **Formula**: 2 * (Precision * Recall) / (Precision + Recall)
- **Range**: 0 to 1 (higher is better)
- **Meaning**: Single metric balancing both precision and recall

### Accuracy
- **Definition**: Percentage of correctly extracted information fields
- **Range**: 0% to 100%
- **Meaning**: Overall correctness of the extraction

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Extraction Accuracy | > 85% | ✓ Good |
| Precision (Entities) | > 80% | ✓ Good |
| Recall (Entities) | > 75% | ✓ Good |
| F1-Score (Entities) | > 77% | ✓ Good |

## Interpreting Visualizations

### Entity Metrics Bar Chart
- Compare performance across different entity types
- Identify underperforming categories
- Make decisions for model improvements

### Accuracy Distribution
- Histogram showing how many samples fall into each accuracy range
- Red dashed line shows average accuracy
- Helps identify consistency issues

### Performance Dashboard
- Comprehensive overview of all metrics
- Quick status indicator (PASSED/NEEDS IMPROVEMENT)
- Summary information and test metadata

## Customizing Tests

### Adding More Test Samples

Edit the `get_test_data()` function in `test_accuracy.py`:

```python
def get_test_data() -> List[Tuple[str, dict]]:
    return [
        (cv_text, expected_output),
        # Add more samples here
    ]
```

### Modifying Test Scenarios

Extend the `CVModelAccuracyTester` class to add custom tests:

```python
tester = CVModelAccuracyTester()

# Add custom test logic
tester.test_specific_entity_type(entity_type, test_data)
```

### Changing Output Directory

```python
visualizer = ModelMetricsVisualizer(output_dir="./my_plots")
```

## Troubleshooting

### Issue: "Model not found"
**Solution**: Run `python train_model.py` first to train the model.

### Issue: Missing dependencies
**Solution**: Install missing packages with:
```bash
pip install matplotlib scikit-learn seaborn
```

### Issue: Plots not generating
**Solution**: Check that the `plots/` directory is writable. Create it manually if needed:
```bash
mkdir plots
```

### Issue: Out of memory error
**Solution**: Reduce the number of test samples or run on a machine with more RAM.

## Integration with CI/CD

These scripts can be integrated into your CI/CD pipeline:

```yaml
# Example: GitHub Actions
- name: Run accuracy tests
  run: python test_accuracy.py

- name: Generate visualizations
  run: python plot_metrics.py

- name: Upload results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: |
      test_results.json
      test_report.html
      plots/
```

## Next Steps

1. **Improve Model**: Use visualization insights to identify improvement areas
2. **Expand Test Data**: Add more diverse CV samples for better validation
3. **Monitor Performance**: Track metrics over time as you improve the model
4. **Fine-tune Entity Rules**: Adjust patterns in `train_model.py` based on results
5. **Retrain Model**: Update model with corrected training data for better accuracy

## Support

For issues or questions:
1. Check the console output for specific error messages
2. Review `test_results.json` for detailed metrics
3. Examine sample visualizations to understand model behavior
4. Verify all dependencies are installed correctly

---

**Last Updated**: 2026-05-19
