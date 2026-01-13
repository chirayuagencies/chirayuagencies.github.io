import pandas as pd
import re

# Manually pasted town-count data (from the user message)
raw_data = """
AJNAS	1
ALIRAJPUR	3
ALOT	1
ANJAD	3
ARON	1
ASHTA	2
BADNAGAR	1
BADNAWAR	2
BAGLI	1
BAIRAGARH	1
BALAGHAT	3
BANAPURA	1
BANMORE	1
BARGHAT	1
BADNAGAR	1
BARODA	1
BARWAHA	3
BARWANI	4
BEDIYA	2
BEOHARI	2
BETMA	1
BETUL	3
BHABHRA	1
BHANDER	1
BHIND	2
BHOPAL	16
BIAORA	1
BURHANPUR	3
CHANERA	1
CHAPDA	2
CHHATARPUR	4
CHHINDWARA	7
DABRA	1
DAMOH	1
DATIA	1
DEOTALAB	1
DEWAS	3
DHAMNOD	1
DHAR	4
DHARAMPURI	1
DHARGAON	2
DINDORI	1
GANJ BASODA	1
GAROTH	1
GHATABILLOD	1
GOGAWA	1
GUNA	3
GWALIOR	12
HARDA	4
HATOD	1
NARMADAPURAM 3
INDERGARH	1
INDORE	36
ITARSI	2
JABALPUR	13
JAORA	3
JHABUA	2
JOURA	1
KALAPIPAL MANDI	1
KANNOD	1
KARELI	1
KASRAWAD	2
KATNI	4
KHACHROD	1
KHANDWA	7
KHARGONE	8
KHATEGAON	3
KHETIYA	1
KHIRKIYA	1
KUKSHI	3
MAHESHWAR	3
MAHIDPUR	1
MAIHAR	2
MAKDON	1
MAKSI	2
MANASA	2
MANAWAR	1
MANDLA	2
MANDSAUR	3
MANGLIYA	1
MEGHNAGAR	1
MHOW	2
MORENA	5
NAGDA	2
NALKHEDA	1
NARSINGHPUR	2
NEEMUCH	2
OZHAR	1
PACHORE	3
PANAGAR	1
PANDHURNA	1
PARASIA	1
PIPARIYA	1
PIPLIYA MANDI	1
PORSA	1
RAIPUR	1
RAISEN	1
RAJGARH	1
RAJPUR	1
RATLAM	6
REWA	6
SABALGARH	2
SAGAR	6
SANAWAD	2
SANWER	1
SARANGPUR	2
SATNA	7
SEHORE	2
SENDHWA	4
SEONDHA	1
SEONI	3
SHAHDOL	3
SHAHPUR	1
SHAJAPUR	2
SHAMGARGH	2
SHEOPUR	3
SHIVPURI	1
SHUJALPUR	2
SIDHI	1
SIHORA	1
SINGRAULI	2
SIRONJ	1
SITAMAU	1
SONKATCH	1
TARANA	1
THANDLA	1
TIKAMGARH	2
TIMARNI	1
UJJAIN	12
VIDISHA 1
AGRA    5
DELHI   3
KANPUR  2
"""

df = pd.read_csv('mp all towns.csv')


# Convert the raw data into a dictionary
# town_counts = dict(re.findall(r"([A-Z\s]+)\t(\d+)", raw_data))
lines = raw_data.strip().split('\n')

town_counts = dict(map(lambda x: (' '.join(x.split()[:-1]), x.split()[-1]), lines))

# town_counts = dict([tuple(x.strip().split()) for x in raw_data.strip().split('\n')])


# print(town_counts)

# Convert count values to integers
town_counts = {town.strip(): int(count) for town, count in town_counts.items()}

# Convert to a DataFrame
count_df = pd.DataFrame(list(town_counts.items()), columns=["Town", "Party Count"])


# Normalize town names in both datasets for accurate merging
df["Town_clean"] = df["Town"].str.upper().str.strip()
count_df["Town_clean"] = count_df["Town"].str.upper().str.strip()

# Merge using the cleaned town names
merged_df = df.merge(count_df[["Town_clean", "Party Count"]], on="Town_clean", how="outer")

merged_df=merged_df[merged_df["Party Count"].notna()]

merged_df = merged_df.reset_index(drop=True)


# print(merged_df.isna())


merged_df["Town"].fillna(merged_df["Town_clean"], inplace=True)

# Drop the helper column and reorder
merged_df.drop(columns=["Town_clean"], inplace=True)

# Display the updated dataset
# print(merged_df.head(10))

merged_df.to_csv("party_count_town_details.csv")



# # Merge with the original dataset on 'Town'
# merged_df = df.merge(count_df, on="Town", how="left")

# # Display the merged data
# merged_df.head(10)
