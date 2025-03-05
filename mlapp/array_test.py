import numpy as np

try:
    data = np.load('output_array.npy')

    # Print shape
    print(f"Data Shape: {data.shape}")

    # Print the first 10 elements, to 5 decimals
    # print(f"Elements: {data.round(5)[:10]}")

    # print the first 5 rows of the first column of data, do not concatenate
    # print(f"First 5 Rows: {data.round(6)[:10, 0]}")

    # print first 5 rows and 5 columns of data, do not concatenate
    print(f"\nFirst 5 Rows and 5 Columns:\n{data.round(2)[:10,:10]}")

    # Print data type
    print(f"Data Type: {data.dtype}")

    # Print min/max
    print(f"Min: {np.min(data)}, Max: {np.max(data)}")

except FileNotFoundError:
    print(f"Error: The file was not found.")
except Exception as e:
    print(f"An error occurred: {e}")