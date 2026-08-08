import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Imputes missing values with column median values.
    """
    # Fill numeric NaNs
    for col in df.select_dtypes(include=[np.number]).columns:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())
    return df

def preprocess_and_split_dataset(data: pd.DataFrame, test_size=0.2, random_state=42):
    """
    Cleans, normalizes, and splits datasets for training.
    """
    df = data.copy()
    df = handle_missing_values(df)
    
    # Separate features and target
    target_col = "suitability"
    if target_col in df.columns:
        X = df.drop(columns=[target_col])
        y = df[target_col]
    else:
        X = df
        y = None
        
    # Scale features using Standard Scaler
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(scaled_features, columns=X.columns)
    
    if y is not None:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=test_size, random_state=random_state
        )
        return X_train, X_test, y_train, y_test, scaler
    else:
        return X_scaled, scaler
