#!/bin/bash
# Seeds the aval-records DynamoDB table with demo vendor applications.
# Run once before the demo: bash scripts/seed-vendors.sh
set -e

TABLE="aval-records"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

put() {
  local VENDOR_ID="$1"
  local NAME="$2"
  local BIZ="$3"
  local REGION="$4"
  local CATEGORY="$5"
  local WALLET="$6"
  local STATUS="$7"
  local DOCS="$8"
  local FLAGS="$9"
  local CONF="${10}"
  local REC="${11}"
  local OFFSET_MINS="${12}"

  # Compute submittedAt as NOW minus OFFSET_MINS
  SUBMITTED=$(date -u -v-${OFFSET_MINS}M +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "${OFFSET_MINS} minutes ago" +"%Y-%m-%dT%H:%M:%SZ")

  aws dynamodb put-item \
    --table-name "$TABLE" \
    --item "{
      \"PK\":           {\"S\": \"VENDOR_QUEUE\"},
      \"SK\":           {\"S\": \"APPLICATION#${VENDOR_ID}\"},
      \"vendorId\":     {\"S\": \"${VENDOR_ID}\"},
      \"name\":         {\"S\": \"${NAME}\"},
      \"biz\":          {\"S\": \"${BIZ}\"},
      \"region\":       {\"S\": \"${REGION}\"},
      \"category\":     {\"S\": \"${CATEGORY}\"},
      \"walletAddress\":{\"S\": \"${WALLET}\"},
      \"status\":       {\"S\": \"${STATUS}\"},
      \"submittedAt\":  {\"S\": \"${SUBMITTED}\"},
      \"docs\":         {\"N\": \"${DOCS}\"},
      \"flags\":        {\"N\": \"${FLAGS}\"},
      \"conf\":         {\"N\": \"${CONF}\"},
      \"rec\":          {\"S\": \"${REC}\"}
    }"
  echo "  seeded $VENDOR_ID — $BIZ"
}

echo "Seeding vendor queue into $TABLE..."

#          ID         Name                    Business                  Region                    Category     Wallet                                       Status   Docs Flags Conf  Rec       Offset(min)
put "VND-0042" "Carlos Méndez"      "Cocina La Borinqueña"  "Puerto Rico · Ponce"     "restaurant" "0xFa7C7B4a7D1a95c1D4CeF94e8B6774aFE74a7A58" "pending"   5    1    0.92  "approve"  2
put "VND-0041" "Rosalía Brun"       "Café del Pueblo"       "Puerto Rico · San Juan"  "restaurant" "0xD745d710350D0389ea8aCC68ECC8083C0BeE7e19" "pending"   4    0    0.97  "approve"  9
put "VND-0040" "Ti Marc Joseph"     "Marché Joseph"         "Haiti · Cap-Haïtien"     "food_shop"  "0x64cF124F126f87451Ba13f1D6d01A65199b39Cdd" "pending"   6    3    0.61  "escalate" 14
put "VND-0039" "Aqua Dominicana"    "Aqua Dominicana SRL"   "DR · Santo Domingo"      "water"      "0x03233BDa29b31CB927e064737336b5433013481b" "pending"   5    0    0.95  "approve"  22
put "VND-0038" "Familia Soto"       "Panadería Soto"        "Puerto Rico · Mayagüez"  "food_shop"  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" "pending"   3    2    0.44  "reject"   31
put "VND-0037" "Hadi Khoury"        "Khoury Catering"       "Puerto Rico · Bayamón"   "restaurant" "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" "pending"   4    0    0.93  "approve"  58

echo "Done. 6 vendor applications seeded."
