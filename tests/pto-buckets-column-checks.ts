import assert from "node:assert/strict";
import {
  createPtoBucketColumnsModel,
  ptoBucketColumnsSourceSignature,
} from "../lib/domain/pto/buckets";
import { createPtoCycleColumns } from "../lib/domain/pto/cycle";

const bucketColumnsModel = createPtoBucketColumnsModel([
  {
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "336",
    name: "CAT 336",
  },
  {
    visible: true,
    vehicleType: "\u041f\u043e\u0433\u0440\u0443\u0437\u0447\u0438\u043a",
    brand: "Liebherr",
    model: "566",
    name: "Liebherr 566",
  },
  {
    visible: true,
    vehicleType: "\u0421\u0430\u043c\u043e\u0441\u0432\u0430\u043b",
    brand: "Howo",
    model: "371",
    name: "Howo 371",
  },
] as never);
assert.deepEqual(bucketColumnsModel.columns.map((column) => column.label), ["CAT 336", "Liebherr 566"]);

const duplicateBucketColumnsModel = createPtoBucketColumnsModel([
  {
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "336",
    name: "CAT 336 A",
  },
  {
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "C AT",
    model: "3 36",
    name: "CAT 336 B",
  },
] as never);
assert.equal(duplicateBucketColumnsModel.columns.length, 1);
assert.equal(duplicateBucketColumnsModel.columns[0].duplicate, true);

const duplicateBrandModelWithDifferentMetadataColumnsModel = createPtoBucketColumnsModel([
  {
    id: 11,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    equipmentType: "\u0413\u0443\u0441\u0435\u043d\u0438\u0447\u043d\u044b\u0439",
    brand: "CAT",
    model: "336",
    name: "CAT 336 A",
    plateNumber: "111AAA",
    garageNumber: "G-1",
    owner: "Owner A",
  },
  {
    id: 12,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    equipmentType: "\u041a\u043e\u043b\u0435\u0441\u043d\u044b\u0439",
    brand: "C AT",
    model: "3 36",
    name: "CAT 336 B",
    plateNumber: "222BBB",
    garageNumber: "G-2",
    owner: "Owner B",
  },
] as never);
assert.equal(duplicateBrandModelWithDifferentMetadataColumnsModel.columns.length, 1);
assert.equal(duplicateBrandModelWithDifferentMetadataColumnsModel.columns[0].duplicate, true);

const duplicateCycleColumns = createPtoCycleColumns([
  {
    id: 21,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "336",
    name: "CAT 336 A",
  },
  {
    id: 22,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "C AT",
    model: "3 36",
    name: "CAT 336 B",
  },
] as never);
assert.equal(duplicateCycleColumns.length, 1);
assert.equal(duplicateCycleColumns[0].duplicate, true);
assert.match(duplicateCycleColumns[0].key, /^cycle:/);

const joinedLabelButDifferentBrandModelColumnsModel = createPtoBucketColumnsModel([
  {
    id: 101,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "336",
    name: "CAT 336",
  },
  {
    id: 102,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT3",
    model: "36",
    name: "CAT3 36",
  },
] as never);
assert.equal(joinedLabelButDifferentBrandModelColumnsModel.columns.length, 2);
assert.deepEqual(
  joinedLabelButDifferentBrandModelColumnsModel.columns.map((column) => column.duplicate ?? false),
  [false, false],
);

const differentBrandModelWithSameMetadataColumnsModel = createPtoBucketColumnsModel([
  {
    id: 103,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "336",
    name: "Shared loader",
    plateNumber: "111AAA",
    garageNumber: "G-1",
    owner: "Owner A",
  },
  {
    id: 104,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "Komatsu",
    model: "PC400",
    name: "Shared loader",
    plateNumber: "111AAA",
    garageNumber: "G-1",
    owner: "Owner A",
  },
] as never);
assert.equal(differentBrandModelWithSameMetadataColumnsModel.columns.length, 2);
assert.deepEqual(
  differentBrandModelWithSameMetadataColumnsModel.columns.map((column) => column.duplicate ?? false),
  [false, false],
);

const incompleteBrandModelColumnsModel = createPtoBucketColumnsModel([
  {
    id: 201,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "",
    model: "336",
    name: "CAT 336 A",
  },
  {
    id: 202,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "",
    model: "3 36",
    name: "CAT 336 B",
  },
] as never);
assert.equal(incompleteBrandModelColumnsModel.columns.length, 2);
assert.deepEqual(
  incompleteBrandModelColumnsModel.columns.map((column) => column.duplicate ?? false),
  [false, false],
);

const incompleteModelColumnsModel = createPtoBucketColumnsModel([
  {
    id: 203,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "",
    name: "CAT 336 A",
  },
  {
    id: 204,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "C AT",
    model: "",
    name: "CAT 336 B",
  },
] as never);
assert.equal(incompleteModelColumnsModel.columns.length, 2);
assert.deepEqual(
  incompleteModelColumnsModel.columns.map((column) => column.duplicate ?? false),
  [false, false],
);

const emptyBrandModelSameNameColumnsModel = createPtoBucketColumnsModel([
  {
    id: 205,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "",
    model: "",
    name: "CAT 336",
  },
  {
    id: 206,
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "",
    model: "",
    name: "CAT 336",
  },
] as never);
assert.equal(emptyBrandModelSameNameColumnsModel.columns.length, 2);
assert.deepEqual(
  emptyBrandModelSameNameColumnsModel.columns.map((column) => column.duplicate ?? false),
  [false, false],
);

assert.equal(
  ptoBucketColumnsSourceSignature([
    {
      visible: true,
      vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
      brand: "CAT",
      model: "336",
      name: "CAT 336",
      owner: "Owner A",
    },
  ] as never),
  ptoBucketColumnsSourceSignature([
    {
      visible: true,
      vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
      brand: "CAT",
      model: "336",
      name: "CAT 336",
      owner: "Owner B",
    },
  ] as never),
);
