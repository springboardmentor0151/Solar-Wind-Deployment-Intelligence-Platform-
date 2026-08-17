"""
Train Solar ML model using OBSERVED DATA ONLY.

Run:

    python -m ml_training.solar.train
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

from ml_core.preprocessing import PreprocessingPipeline
from ml_training.solar.config import (
    DATASET_PATH,
    DATA_SOURCE,
    DATASET_TYPE,
    FEATURES,
    TARGET,
    SCHEMA_VERSION,
    MODEL_PATH,
    PREPROCESSOR_PATH,
    METADATA_PATH,
    METRICS_PATH,
    TEST_SIZE,
    RANDOM_STATE,
    MODEL_PARAMS,
    validate_config,
)

from ml_training.solar.data_loader import (
    load_solar_observed_data,
)

from ml_training.solar.evaluate import (
    evaluate_model,
    print_metrics,
    save_metrics,
)


DOMAIN = "solar"


def train():

    print("=" * 70)
    print("SOLAR MODEL TRAINING - OBSERVED DATA ONLY")
    print("=" * 70)

    # ---------------------------------------------------------
    # 1. Configuration
    # ---------------------------------------------------------

    print("\n[1/7] Validating configuration...")

    validate_config()

    # ---------------------------------------------------------
    # 2. Load observed dataset
    # ---------------------------------------------------------

    print("\n[2/7] Loading observed dataset...")

    dataframe = load_solar_observed_data(
        DATASET_PATH
    )

    print(
        f"Observed rows: {len(dataframe)}"
    )

    # ---------------------------------------------------------
    # 3. Prepare features and target
    # ---------------------------------------------------------

    print(
        "\n[3/7] Preparing features and target..."
    )

    from ml_core.preprocessing.feature_preparation import (
        prepare_training_data,
    )

    X, y = prepare_training_data(
        dataframe,
        DOMAIN,
    )

    if list(X.columns) != FEATURES:
        raise ValueError(
            "Solar feature ordering mismatch."
        )

    y.name = TARGET

    print(
        f"Features: {FEATURES}"
    )

    print(
        f"Target: {TARGET}"
    )

    # ---------------------------------------------------------
    # 4. Train/test split
    # ---------------------------------------------------------

    print(
        "\n[4/7] Splitting observed dataset..."
    )

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE,
        )
    )

    print(
        f"Training rows: {len(X_train)}"
    )

    print(
        f"Testing rows: {len(X_test)}"
    )

    # ---------------------------------------------------------
    # 5. Preprocessing
    # ---------------------------------------------------------

    print(
        "\n[5/7] Fitting preprocessing..."
    )

    preprocessor = PreprocessingPipeline(
        use_scaler=True
    )

    X_train_processed = (
        preprocessor.fit_transform(
            X_train
        )
    )

    X_test_processed = (
        preprocessor.transform(
            X_test
        )
    )

    # ---------------------------------------------------------
    # 6. Train and evaluate
    # ---------------------------------------------------------

    print(
        "\n[6/7] Training Solar Random Forest..."
    )

    model = RandomForestRegressor(
        **MODEL_PARAMS
    )

    model.fit(
        X_train_processed,
        y_train,
    )

    print(
        "\nEvaluating on held-out observed data..."
    )

    metrics = evaluate_model(
        model,
        X_test_processed,
        y_test,
    )

    print_metrics(metrics)

    # ---------------------------------------------------------
    # 7. Save artifacts
    # ---------------------------------------------------------

    print(
        "\n[7/7] Saving production artifacts..."
    )

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    PREPROCESSOR_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    METADATA_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    METRICS_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    joblib.dump(
        preprocessor,
        PREPROCESSOR_PATH,
    )

    save_metrics(
        metrics,
        METRICS_PATH,
    )

    metadata = {
        "domain": DOMAIN,
        "schema_version": SCHEMA_VERSION,
        "model_type": "RandomForestRegressor",
        "model_version": "1.0.0",

        "features": FEATURES,
        "feature_count": len(FEATURES),
        "target": TARGET,
        "target_unit": "MW",

        "data_source": DATA_SOURCE,
        "dataset_type": DATASET_TYPE,
        "dataset": DATASET_PATH.name,

        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "total_rows": len(dataframe),

        "test_size": TEST_SIZE,
        "random_state": RANDOM_STATE,

        "metrics": metrics,

        "trained_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "preprocessing": (
            preprocessor.get_metadata()
        ),
    }

    with METADATA_PATH.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            metadata,
            file,
            indent=2,
        )

    print("\n" + "=" * 70)
    print("SOLAR TRAINING COMPLETED")
    print("=" * 70)

    print(f"\nModel: {MODEL_PATH}")
    print(f"Preprocessor: {PREPROCESSOR_PATH}")
    print(f"Metrics: {METRICS_PATH}")
    print(f"Metadata: {METADATA_PATH}")

    print("\nData source: OBSERVED")

    return metrics


if __name__ == "__main__":
    train()