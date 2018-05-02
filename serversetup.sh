#!/bin/bash

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# 
# GLOBALS AND CONVENIENCE ROUTINES
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

DEBUG=true
MAX_FAIL_COUNT=3

STORE_LC_COLLATE=${LC_COLLATE}
export LC_COLLATE=C

COL_INVALID_REGEX='[^A-Z]' # match if anything that isn't A-Z
ROW_INVALID_REGEX='[^0-9]' # match if anything that isn't 0-9

function exiterror() {
	echo '  '
	echo "Too many errors. Please check your data and try again. "
	echo '  '
	export LC_COLLATE=${STORE_LC_COLLATE}
	exit
}

function curlerror() {
	echo "Encountered an error in sheet load (${1}). Exiting script."
	export LC_COLLATE=${STORE_LC_COLLATE}
	exit
}

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# 
# NICE HEADER PRINT
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

echo '  '
echo 'Setup script for statesampler server'

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# 
# DOMAIN NAME
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

echo '  '

FAIL_COUNT=0
while true; do
	read -p "Server domain: " SERVER_DOMAIN
	if [[ -z "${SERVER_DOMAIN// }" ]] ; then 
		echo "  Your domain name can't be empty. Please enter a (valid) domain name."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		CURL_CODE=$( curl -o /dev/null -s -w "%{http_code}" "https://${SERVER_DOMAIN}/statesampler/api" )
		if ${DEBUG} ; then 
			echo "  curl returned ${CURL_CODE}"
			break
		else 
			if [[ ${CURL_CODE} -ne 200 ]] ; then 
				echo "Doesn't look like the server is setup (curl returned ${CURL_CODE}). Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				break
			fi
		fi
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# 
# GOOGLE SHEETS API KEY
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

echo '  '

FAIL_COUNT=0
while true; do
	read -p "Initialize server with Google Sheets API key: " GAPI_API_KEY
	if [[ -z "${GAPI_API_KEY// }" ]] ; then 
		echo "  Your API key can't be empty. Please enter a (valid) Google Sheets API key."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		if ${DEBUG} ; then 
			echo "  "
			echo "  GAPI Key: ${GAPI_API_KEY}"
			break
		else 
			CURL_CODE=$( curl -o /dev/null -s -w \
							-XPOST "https://${SERVER_DOMAIN}/statesampler/api/init" \
							-H "Content-type: application/json" \
							-d '{ "apikey" : "'${GAPI_API_KEY}'" }' )
			if [[ ${CURL_CODE} -ne 200 ]] ; then 
				echo "  Could not verify the API key. Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				break
			fi
		fi
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# 
# DATA SPREADSHEET
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

# Spreadsheet ID

echo '  '

FAIL_COUNT=0
while true; do
	read -p "Load data from spreadsheet ID: " SHEET_TO_LOAD
	if [[ -z "${SHEET_TO_LOAD// }" ]] ; then 
		echo "  Your Spreadsheet ID can't be empty. Please enter a (valid) Google Sheets Spreadsheet ID."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		break
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# Sheet name

FAIL_COUNT=0
while true; do
	read -p "  in sheet (\"Sheet1\"): " RANGE_TO_LOAD_SHEET
	RANGE_TO_LOAD_SHEET="${RANGE_TO_LOAD_SHEET:=Sheet1}"
	if [[ -z "${RANGE_TO_LOAD_SHEET// }" ]] ; then 
		echo "    Your sheet name can't be empty. Please enter a (valid) sheet name."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		break
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# From column

FAIL_COUNT=0
while true; do
	read -p "  from column (A)    : " RANGE_TO_LOAD_FROM_COL
	RANGE_TO_LOAD_FROM_COL="${RANGE_TO_LOAD_FROM_COL:=A}"
	if [[ -z "${RANGE_TO_LOAD_FROM_COL// }" ]] ; then 
		echo "  Your \"from\" column identifier can't be empty. Please enter a (valid) column identifier (e.g., A, B, ...)."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		if [[ ${RANGE_TO_LOAD_FROM_COL} =~ ${COL_INVALID_REGEX} ]] ; then 
			echo "    Column identifiers must be pure capital letters (e.g., A, B, ...). Please try again."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			break
		fi 
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# To column

FAIL_COUNT=0
while true; do
	read -p "  to column          : " RANGE_TO_LOAD_TO_COL
	if [[ -z "${RANGE_TO_LOAD_TO_COL// }" ]] ; then 
		echo "  Your \"to\" column can't be empty. Please enter a (valid) column identifier (e.g. A, B, ...)."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		if [[ ${RANGE_TO_LOAD_TO_COL} =~ ${COL_INVALID_REGEX} ]] ; then 
			echo "    Column identifiers must be (sets of) capital letters (e.g., A, B, ...). Please try again."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			if [[ ${RANGE_TO_LOAD_TO_COL} < ${RANGE_TO_LOAD_FROM_COL} ]] ; then 
				echo "    Your \"to\" column (${RANGE_TO_LOAD_TO_COL}) can't come before your \"from\" column (${RANGE_TO_LOAD_FROM_COL}). Please enter a (valid) column identifier (>= ${RANGE_TO_LOAD_FROM_COL})."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				break
			fi 
		fi 
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# From row

FAIL_COUNT=0
while true; do
	read -p "  from row (2)       : " RANGE_TO_LOAD_FROM_ROW
	RANGE_TO_LOAD_FROM_ROW="${RANGE_TO_LOAD_FROM_ROW:=2}"
	if [[ -z "${RANGE_TO_LOAD_FROM_ROW// }" ]] ; then 
		echo "  Your \"from\" row can't be empty. Please enter a (valid) row identifier (e.g., 1, 2, ...)."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		if [[ ${RANGE_TO_LOAD_FROM_ROW} =~ ${ROW_INVALID_REGEX} ]] ; then 
			echo "    Row identifiers must be positive integers (e.g., 1, 2, ...). Please try again."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			if [[ ${RANGE_TO_LOAD_FROM_ROW} -le 0 ]] ; then 
				echo "    Row identifiers must be positive integers (e.g., 1, 2, ...). Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				break
			fi
		fi 
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# To row

FAIL_COUNT=0
while true; do
	read -p "  to row             : " RANGE_TO_LOAD_TO_ROW
	RANGE_TO_LOAD_TO_ROW="${RANGE_TO_LOAD_TO_ROW:=2}"
	if [[ -z "${RANGE_TO_LOAD_TO_ROW// }" ]] ; then 
		echo "  Your \"to\" row can't be empty. Please enter a (valid) row identifier (e.g., 1, 2, ...)."
		FAIL_COUNT=$(( FAIL_COUNT + 1 ))
	else 
		if [[ ${RANGE_TO_LOAD_TO_ROW} =~ ${ROW_INVALID_REGEX} ]] ; then 
			echo "    Row identifiers must be positive integers (e.g., 1, 2, ...). Please try again."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			if [[ ${RANGE_TO_LOAD_TO_ROW} -le 0 ]] ; then 
				echo "    Row identifiers must be positive integers (e.g., 1, 2, ...). Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				if [[ ${RANGE_TO_LOAD_TO_ROW} -lt ${RANGE_TO_LOAD_FROM_ROW} ]] ; then 
					echo "    Your \"to\" row (${RANGE_TO_LOAD_TO_ROW}) can't be less than your \"from\" row (${RANGE_TO_LOAD_FROM_ROW}). Please enter a (valid) row identifier (>= ${RANGE_TO_LOAD_FROM_ROW})."
					FAIL_COUNT=$(( FAIL_COUNT + 1 ))
				else 
					break
				fi 
			fi
		fi 
	fi
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

# Process range data

SHEET_LOAD_RANGE="${RANGE_TO_LOAD_SHEET}!"
SHEET_LOAD_RANGE="${SHEET_LOAD_RANGE}${RANGE_TO_LOAD_FROM_COL}${RANGE_TO_LOAD_FROM_ROW}:"
SHEET_LOAD_RANGE="${SHEET_LOAD_RANGE}${RANGE_TO_LOAD_TO_COL}${RANGE_TO_LOAD_TO_ROW}"

if ${DEBUG} ; then 
	echo "  "
	echo "  Spreadsheet: ${SHEET_TO_LOAD}"
	echo "  Range: ${SHEET_LOAD_RANGE}"
else 
	CURL_CODE=$( curl -o /dev/null -s -w \
					-XPOST "https://${SERVER_DOMAIN}/statesampler/api/load" \
					-H "Content-type: application/json" \
					-d '{ "spreadsheetId" : "'${SHEET_TO_LOAD}'" , "range" : "'${SHEET_LOAD_RANGE}'" }' )
	if [[ ${CURL_CODE} -ne 200 ]] ; then curlerror ${CURL_CODE}; fi
fi

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# 
# (OPTIONAL) HEADER
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

echo '  '

READ_HEADER=true
while true; do
	read -p "Read a header row? (y/n): " opt
	case ${opt} in
		[Yy]* ) break;;
		[Nn]* ) READ_HEADER=false; break;;
		* ) echo "  Please answer yes (Yy) or no (Nn)."; FAIL_COUNT=$(( FAIL_COUNT + 1 ));
	esac
	if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
	echo '  '
done

if ${READ_HEADER} ; then 

	echo '  '

	# Header spreadsheet ID

	FAIL_COUNT=0
	while true; do
		read -p "  header spreadsheet ID  (${SHEET_TO_LOAD}):" HEADER_SHEET_TO_LOAD
		HEADER_SHEET_TO_LOAD="${HEADER_SHEET_TO_LOAD:=SHEET_TO_LOAD}"
		if [[ -z "${HEADER_SHEET_TO_LOAD// }" ]] ; then 
			echo "  Your Header's Spreadsheet ID can't be empty. Please enter a (valid) Google Sheets Spreadsheet ID."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			break
		fi
		if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
		echo '  '
	done

	# Header sheet name

	FAIL_COUNT=0
	while true; do
		read -p "  from sheet (${RANGE_TO_LOAD_SHEET}): " HEADER_RANGE_TO_LOAD_SHEET			
		HEADER_RANGE_TO_LOAD_SHEET="${HEADER_RANGE_TO_LOAD_SHEET:=RANGE_TO_LOAD_SHEET}"
		if [[ -z "${HEADER_RANGE_TO_LOAD_SHEET// }" ]] ; then 
			echo "    Your header sheet name can't be empty. Please enter a (valid) sheet name."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			break
		fi
		if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
		echo '  '
	done

	# From column

	FAIL_COUNT=0
	while true; do
		read -p "  from column (${RANGE_TO_LOAD_FROM_COL}): " HEADER_RANGE_TO_LOAD_FROM_COL
		HEADER_RANGE_TO_LOAD_FROM_COL="${HEADER_RANGE_TO_LOAD_FROM_COL:=RANGE_TO_LOAD_FROM_COL}"
		if [[ -z "${HEADER_RANGE_TO_LOAD_FROM_COL// }" ]] ; then 
			echo "  Your \"to\" column can't be empty. Please enter a (valid) column identifier (e.g. A, B, ...)."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			if [[ ${HEADER_RANGE_TO_LOAD_FROM_COL} =~ ${COL_INVALID_REGEX} ]] ; then 
				echo "    Column identifiers must be (sets of) capital letters (e.g., A, B, ...). Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				break
			fi 
		fi
		if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
		echo '  '
	done

	# To column

	FAIL_COUNT=0
	while true; do
		read -p "  to column (${RANGE_TO_LOAD_TO_COL}): " HEADER_RANGE_TO_LOAD_TO_COL
		HEADER_RANGE_TO_LOAD_TO_COL="${HEADER_RANGE_TO_LOAD_TO_COL:=RANGE_TO_LOAD_TO_COL}"
		if [[ -z "${HEADER_RANGE_TO_LOAD_TO_COL// }" ]] ; then 
			echo "  Your \"to\" column can't be empty. Please enter a (valid) column identifier (e.g. A, B, ...)."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			if [[ ${HEADER_RANGE_TO_LOAD_TO_COL} =~ ${COL_INVALID_REGEX} ]] ; then 
				echo "    Column identifiers must be (sets of) capital letters (e.g., A, B, ...). Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				if [[ ${HEADER_RANGE_TO_LOAD_TO_COL} < ${HEADER_RANGE_TO_LOAD_FROM_COL} ]] ; then 
					echo "    Your \"to\" column (${HEADER_RANGE_TO_LOAD_TO_COL}) can't come before your \"from\" column (${HEADER_RANGE_TO_LOAD_FROM_COL}). Please enter a (valid) column identifier (>= ${HEADER_RANGE_TO_LOAD_FROM_COL})."
					FAIL_COUNT=$(( FAIL_COUNT + 1 ))
				else 
					break
				fi 
			fi 
		fi
		if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
		echo '  '
	done

	# Row

	FAIL_COUNT=0
	while true; do
		read -p "  in row (1)             : " HEADER_RANGE_TO_LOAD_ROW
		HEADER_RANGE_TO_LOAD_ROW="${HEADER_RANGE_TO_LOAD_ROW:=1}"
		if [[ -z "${HEADER_RANGE_TO_LOAD_ROW// }" ]] ; then 
			echo "  Your header row can't be empty. Please enter a (valid) row identifier (e.g., 1, 2, ...)."
			FAIL_COUNT=$(( FAIL_COUNT + 1 ))
		else 
			if [[ ${HEADER_RANGE_TO_LOAD_ROW} =~ ${ROW_INVALID_REGEX} ]] ; then 
				echo "    Row identifiers must be positive integers (e.g., 1, 2, ...). Please try again."
				FAIL_COUNT=$(( FAIL_COUNT + 1 ))
			else 
				if [[ ${HEADER_RANGE_TO_LOAD_ROW} -le 0 ]] ; then 
					echo "    Row identifiers must be positive integers (e.g., 1, 2, ...). Please try again."
					FAIL_COUNT=$(( FAIL_COUNT + 1 ))
				else 
					break
				fi
			fi 
		fi
		if [[ ${FAIL_COUNT} -ge ${MAX_FAIL_COUNT} ]] ; then exiterror; fi
		echo '  '
	done

	# Process range data

	HEADER_LOAD_RANGE="${HEADER_RANGE_TO_LOAD_SHEET}!"
	HEADER_LOAD_RANGE="${HEADER_LOAD_RANGE}${HEADER_RANGE_TO_LOAD_FROM_COL}${HEADER_RANGE_TO_LOAD_ROW}:"
	HEADER_LOAD_RANGE="${HEADER_LOAD_RANGE}${HEADER_RANGE_TO_LOAD_TO_COL}${HEADER_RANGE_TO_LOAD_ROW}"

	if ${DEBUG} ; then 
		echo "  "
		echo "  Header Spreadsheet: ${HEADER_SHEET_TO_LOAD}"
		echo "  Header Range: ${HEADER_LOAD_RANGE}"
	else 
		CURL_CODE=$( curl -o /dev/null -s -w \
						-XPOST "https://${SERVER_DOMAIN}/statesampler/api/header" \
						-H "Content-type: application/json" \
						-d '{ "spreadsheetId" : "'${HEADER_SHEET_TO_LOAD}'" , "range" : "'${HEADER_SHEET_LOAD_RANGE}'" }' )
		if [[ ${CURL_CODE} -ne 200 ]] ; then curlerror ${CURL_CODE}; fi
	fi

fi

