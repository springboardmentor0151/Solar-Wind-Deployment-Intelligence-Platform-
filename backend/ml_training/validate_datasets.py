"""
Validate the production Solar and Wind datasets.

Production ML uses OBSERVED DATA ONLY.

Run:

    python -m ml_training.validate_datasets
"""

from __future__ import annotations

import sys

from ml_training.common.validation import (
    DatasetValidationError,
    print_validation_report,
    validate_dataset_file,
)

from ml_training.solar.config import (
    DATASET_PATH as SOLAR_DATASET,
)

from ml_training.wind.config import (
    DATASET_PATH as WIND_DATASET,
)


def validate_solar() -> dict:
    """
    Validate the Solar observed dataset.
    """

    print("\n" + "=" * 70)
    print("SOLAR DATASET VALIDATION")
    print("=" * 70)

    print(
        "\nDataset:"
        f"\n{SOLAR_DATASET}"
    )

    report = validate_dataset_file(
        SOLAR_DATASET,
        "solar",
    )

    print_validation_report(
        report
    )

    return report


def validate_wind() -> dict:
    """
    Validate the Wind observed dataset.
    """

    print("\n" + "=" * 70)
    print("WIND DATASET VALIDATION")
    print("=" * 70)

    print(
        "\nDataset:"
        f"\n{WIND_DATASET}"
    )

    report = validate_dataset_file(
        WIND_DATASET,
        "wind",
    )

    print_validation_report(
        report
    )

    return report


def main() -> None:
    """
    Validate both production datasets.

    The process stops with a non-zero exit code
    if either dataset fails validation.
    """

    print("=" * 70)
    print("RENEWABLE ENERGY ML DATASET VALIDATION")
    print("OBSERVED DATA ONLY")
    print("=" * 70)

    solar_report = None
    wind_report = None

    # ---------------------------------------------------------
    # Solar
    # ---------------------------------------------------------

    try:

        solar_report = validate_solar()

    except (
        FileNotFoundError,
        DatasetValidationError,
        ValueError,
    ) as exc:

        print("\nSOLAR VALIDATION FAILED")
        print("-" * 70)
        print(str(exc))

        sys.exit(1)

    # ---------------------------------------------------------
    # Wind
    # ---------------------------------------------------------

    try:

        wind_report = validate_wind()

    except (
        FileNotFoundError,
        DatasetValidationError,
        ValueError,
    ) as exc:

        print("\nWIND VALIDATION FAILED")
        print("-" * 70)
        print(str(exc))

        sys.exit(1)

    # ---------------------------------------------------------
    # Final result
    # ---------------------------------------------------------

    if (
        solar_report.get("valid") is True
        and wind_report.get("valid") is True
    ):

        print("\n" + "=" * 70)
        print("DATASET VALIDATION PASSED")
        print("=" * 70)

        print(
            "\nSolar dataset : PASS"
        )

        print(
            "Wind dataset  : PASS"
        )

        print(
            "\nBoth datasets are ready for ML training."
        )

        print(
            "\nData source: OBSERVED"
        )

    else:

        print("\n" + "=" * 70)
        print("DATASET VALIDATION FAILED")
        print("=" * 70)

        sys.exit(1)


if __name__ == "__main__":
    main()