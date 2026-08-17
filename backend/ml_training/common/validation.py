from __future__ import annotations

from pathlib import Path

import pandas as pd

from ml_core.contracts.feature_contracts import (
    FEATURE_RANGES,
    TARGET_RANGES,
    get_features,
    get_target,
)


class DatasetValidationError(ValueError):
    pass


def load_dataset(path: str | Path) -> pd.DataFrame:

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {path}"
        )

    if path.suffix.lower() != ".csv":
        raise DatasetValidationError(
            f"Expected CSV dataset, got: {path.suffix}"
        )

    dataframe = pd.read_csv(path)

    if dataframe.empty:
        raise DatasetValidationError(
            f"Dataset is empty: {path}"
        )

    return dataframe


def validate_columns(
    dataframe: pd.DataFrame,
    domain: str,
) -> None:

    features = get_features(domain)
    target = get_target(domain)

    required = [*features, target]

    missing = [
        column
        for column in required
        if column not in dataframe.columns
    ]

    if missing:
        raise DatasetValidationError(
            f"{domain} dataset missing columns: {missing}"
        )


def validate_numeric_columns(
    dataframe: pd.DataFrame,
    domain: str,
) -> None:

    columns = [
        *get_features(domain),
        get_target(domain),
    ]

    invalid = []

    for column in columns:

        converted = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

        if converted.isna().any():
            invalid.append(column)

    if invalid:
        raise DatasetValidationError(
            f"Invalid numeric values in {domain}: {invalid}"
        )


def validate_missing_values(
    dataframe: pd.DataFrame,
    domain: str,
) -> None:

    columns = [
        *get_features(domain),
        get_target(domain),
    ]

    missing = dataframe[columns].isna().sum()

    problems = {
        column: int(count)
        for column, count in missing.items()
        if count > 0
    }

    if problems:
        raise DatasetValidationError(
            f"Missing values in {domain}: {problems}"
        )


def validate_ranges(
    dataframe: pd.DataFrame,
    domain: str,
) -> None:

    for column in get_features(domain):

        if column not in FEATURE_RANGES:
            continue

        minimum, maximum = FEATURE_RANGES[column]

        values = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

        invalid = (
            (values < minimum)
            | (values > maximum)
        )

        count = int(invalid.sum())

        if count:
            raise DatasetValidationError(
                f"{domain} feature '{column}' has "
                f"{count} values outside "
                f"[{minimum}, {maximum}]"
            )

    target = get_target(domain)

    if target in TARGET_RANGES:

        minimum, maximum = TARGET_RANGES[target]

        values = pd.to_numeric(
            dataframe[target],
            errors="coerce",
        )

        invalid = (
            (values < minimum)
            | (values > maximum)
        )

        count = int(invalid.sum())

        if count:
            raise DatasetValidationError(
                f"{domain} target '{target}' has "
                f"{count} values outside "
                f"[{minimum}, {maximum}]"
            )


def validate_target_variance(
    dataframe: pd.DataFrame,
    domain: str,
) -> None:

    target = get_target(domain)

    if dataframe[target].nunique() < 2:
        raise DatasetValidationError(
            f"{domain} target has fewer than 2 unique values."
        )

    if float(dataframe[target].std()) == 0.0:
        raise DatasetValidationError(
            f"{domain} target has zero variance."
        )


def validate_dataset(
    dataframe: pd.DataFrame,
    domain: str,
) -> dict:

    domain = domain.lower().strip()

    validate_columns(dataframe, domain)
    validate_numeric_columns(dataframe, domain)
    validate_missing_values(dataframe, domain)
    validate_ranges(dataframe, domain)
    validate_target_variance(dataframe, domain)

    return {
        "valid": True,
        "domain": domain,
        "rows": len(dataframe),
        "features": len(get_features(domain)),
        "feature_names": get_features(domain),
        "target": get_target(domain),
        "missing_values": 0,
    }


def validate_dataset_file(
    path: str | Path,
    domain: str,
) -> dict:

    dataframe = load_dataset(path)

    return validate_dataset(
        dataframe,
        domain,
    )


def print_validation_report(
    report: dict,
) -> None:

    print("=" * 60)
    print(f"{report['domain'].upper()} DATASET")
    print("=" * 60)

    print("Status: PASS")
    print(f"Rows: {report['rows']}")
    print(f"Features: {report['features']}")
    print(f"Target: {report['target']}")

    print("\nFeatures:")

    for feature in report["feature_names"]:
        print(f"  - {feature}")

    print("=" * 60)