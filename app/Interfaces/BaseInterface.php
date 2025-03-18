<?php

namespace App\Interfaces;

interface BaseInterface
{
    public function all($paginate);
    public function find($id);
    public function store(array $data);
    public function update($id, array $data);
    public function delete($id);
}
